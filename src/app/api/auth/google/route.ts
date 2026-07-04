import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/prisma/client";
import { createUserToken } from "@/utilities/auth/jwt";
import { getLoginContext } from "@/utilities/auth/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const sanitizeUsername = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20) || "user";

const generateUniqueUsername = async (email: string) => {
    const base = sanitizeUsername(email.split("@")[0] || "user");

    for (let index = 0; index < 10; index += 1) {
        const candidate = index === 0 ? base : `${base}${index}`;
        const exists = await prisma.user.findUnique({ where: { username: candidate } });
        if (!exists) return candidate;
    }

    return `${base}${crypto.randomBytes(3).toString("hex")}`.slice(0, 20);
};

const getDisplayName = (fullName?: string | null, email?: string | null) => {
    const trimmedName = fullName?.trim();
    if (trimmedName) return trimmedName;
    const prefix = email?.split("@")[0]?.trim();
    if (prefix) return prefix;
    return "Google User";
};

export async function POST(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json({ success: false, message: "Supabase credentials are not configured." });
    }

    const { accessToken } = await request.json();

    if (!accessToken) {
        return NextResponse.json({ success: false, message: "Missing access token." });
    }

    try {
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data.user?.email) {
            return NextResponse.json({ success: false, message: "Google authentication failed." });
        }

        const googleUser = data.user;
        const email = googleUser.email;
        if (!email) {
            return NextResponse.json({ success: false, message: "Google account email is required." });
        }
        const name = getDisplayName(googleUser.user_metadata?.full_name ?? googleUser.user_metadata?.name, email);
        const userAgent = request.headers.get("user-agent") || "";
        const forwardedFor = request.headers.get("x-forwarded-for") || "";
        const loginContext = getLoginContext(userAgent, forwardedFor, request.ip);

        let appUser = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        if (!appUser) {
            const username = await generateUniqueUsername(email);
            const password = crypto.randomBytes(48).toString("base64url");

            appUser = await prisma.user.create({
                data: {
                    username,
                    name,
                    email,
                    password,
                    subscriptionPlan: "FREE",
                    subscriptionExpiry: null,
                    monthlyTweetCount: 0,
                    browserNotificationsEnabled: false,
                    preferredLanguage: "en",
                    isPremium: false,
                },
            });

            await prisma.notification.create({
                data: {
                    userId: appUser.id,
                    type: "welcome",
                    content: JSON.stringify(null),
                },
            });
        }

        await prisma.loginHistory.create({
            data: {
                userId: appUser.id,
                browser: loginContext.browser,
                operatingSystem: loginContext.operatingSystem,
                deviceType: loginContext.deviceType,
                ipAddress: loginContext.ipAddress,
                loginTime: new Date(),
            },
        });

        const token = await createUserToken(appUser);
        const response = NextResponse.json({
            success: true,
            redirectTo: "/home",
        });
        response.cookies.set({
            name: "token",
            value: token,
            path: "/",
        });

        return response;
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Google login failed.",
        });
    }
}

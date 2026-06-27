import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createUserToken } from "@/utilities/auth/jwt";
import { verifyLoginOtp } from "@/utilities/auth/login-otp";

export async function POST(request: NextRequest) {
    const { username, otp } = await request.json();

    if (!username) {
        return NextResponse.json({ success: false, message: "Username is required." });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." });
        }

        const verification = verifyLoginOtp(user.id, otp);
        if (!verification.success || !verification.pending) {
            return NextResponse.json(verification);
        }

        const pendingLogin = verification.pending;

        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                browser: pendingLogin.browser,
                operatingSystem: pendingLogin.operatingSystem,
                deviceType: pendingLogin.deviceType,
                ipAddress: pendingLogin.ipAddress,
                loginTime: new Date(),
            },
        });

        const token = await createUserToken(user);
        const response = NextResponse.json({ success: true });
        response.cookies.set({
            name: "token",
            value: token,
            path: "/",
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

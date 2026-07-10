import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

const PLAN_LIMITS = {
    FREE: 1,
    BRONZE: 3,
    SILVER: 5,
    GOLD: Infinity,
} as const;

const PLAN_LIMIT_MESSAGES = {
    FREE: "Free plan allows only 1 tweet.",
    BRONZE: "Bronze plan allows only 3 tweets per month.",
    SILVER: "Silver plan allows only 5 tweets per month.",
} as const;

export async function POST(request: NextRequest) {
    const { authorId, text, photoUrl, audioUrl } = await request.json();

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token, request.nextUrl.origin));

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.id !== authorId)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (!text?.trim() && !photoUrl && !audioUrl)
        return NextResponse.json({ success: false, message: "Tweet text can't be empty" });

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: authorId,
            },
            select: {
                subscriptionPlan: true,
                subscriptionExpiry: true,
                monthlyTweetCount: true,
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
        }

        const subscriptionExpired = Boolean(user.subscriptionExpiry && new Date(user.subscriptionExpiry).getTime() <= Date.now());
        const activePlan = subscriptionExpired ? "FREE" : user.subscriptionPlan;
        const planLimit = PLAN_LIMITS[activePlan];

        if (user.monthlyTweetCount >= planLimit) {
            const message = activePlan === "GOLD" ? null : PLAN_LIMIT_MESSAGES[activePlan as keyof typeof PLAN_LIMIT_MESSAGES];

            if (message) {
                return NextResponse.json({ success: false, message });
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.tweet.create({
                data: {
                    text,
                    photoUrl,
                    audioUrl,
                    author: {
                        connect: {
                            id: authorId,
                        },
                    },
                },
            });

            await tx.user.update({
                where: {
                    id: authorId,
                },
                data: {
                    monthlyTweetCount: {
                        increment: 1,
                    },
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

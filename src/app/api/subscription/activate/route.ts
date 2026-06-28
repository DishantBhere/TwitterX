import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken } from "@/utilities/auth/jwt";
import { VerifiedToken } from "@/types/TokenProps";

const ACTIVE_PLANS = ["BRONZE", "SILVER", "GOLD"] as const;

type ActivePlan = (typeof ACTIVE_PLANS)[number];

export async function POST(request: NextRequest) {
    const { plan, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json();

    if (!plan || !ACTIVE_PLANS.includes(plan)) {
        return NextResponse.json({ success: false, message: "Invalid subscription plan." });
    }

    const token = cookies().get("token")?.value;
    const verifiedToken: VerifiedToken = token && (await verifyJwtToken(token));

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: verifiedToken.id },
            data: {
                subscriptionPlan: plan as ActivePlan,
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                monthlyTweetCount: 0,
            },
        });

        const newToken = await createUserToken(updatedUser);
        const response = NextResponse.json({
            success: true,
            subscriptionPlan: updatedUser.subscriptionPlan,
            subscriptionExpiry: updatedUser.subscriptionExpiry,
            monthlyTweetCount: updatedUser.monthlyTweetCount,
            payment: {
                razorpayPaymentId,
                razorpayOrderId,
                razorpaySignature,
            },
        });
                response.cookies.set({
            name: "token",
            value: newToken,
            path: "/",
        });

        return response;

    } catch (error) {

        console.error("SUBSCRIPTION ACTIVATE ERROR:", error);

        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });

    }
}
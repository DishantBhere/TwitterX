import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

const PLAN_AMOUNTS = {
    BRONZE: 100,
    SILVER: 300,
    GOLD: 1000,
} as const;

type SubscriptionPlan = keyof typeof PLAN_AMOUNTS;

const makeReceipt = (userId: string, plan: SubscriptionPlan) => {
    const timestamp = Date.now().toString(36);
    const shortUserId = userId.replace(/-/g, "").slice(0, 8);
    return `sub_${plan}_${shortUserId}_${timestamp}`.slice(0, 40);
};

const isWithinPaymentWindow = () => {
    // TEMP: Always allow payments for testing.
    return true;
};

export async function POST(request: NextRequest) {
    const { plan } = await request.json();

    if (!plan || !(plan in PLAN_AMOUNTS)) {
        return NextResponse.json({ success: false, message: "Invalid subscription plan." });
    }

    const token = cookies().get("token")?.value;
    const verifiedToken: VerifiedToken = token && (await verifyJwtToken(token, request.nextUrl.origin));

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
    }

    if (!isWithinPaymentWindow()) {
        return NextResponse.json({
            success: false,
            message: "PAYMENT_WINDOW_RESTRICTED",
        });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return NextResponse.json({ success: false, message: "Razorpay credentials are missing." });
    }

    try {
        const amount = PLAN_AMOUNTS[plan as SubscriptionPlan];
        const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: amount * 100,
                currency: "INR",
                receipt: makeReceipt(verifiedToken.id, plan as SubscriptionPlan),
                notes: {
                    userId: verifiedToken.id,
                    username: verifiedToken.username,
                    plan,
                },
            }),
        });

        const order = await orderResponse.json();

        if (!orderResponse.ok) {
            const message = order?.error?.description || order?.error?.message || "Unable to create Razorpay order.";
            return NextResponse.json({ success: false, message });
        }

        return NextResponse.json({
            success: true,
            keyId,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            plan,
            amount: amount * 100,
        });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { saveAudioOtp } from "@/utilities/audio/otp";
import { UserProps } from "@/types/UserProps";

export async function POST() {
    const token = cookies().get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You must be logged in to upload audio." });
    }

    const user = await prisma.user.findUnique({
        where: { id: verifiedToken.id },
        select: { id: true, email: true },
    });

    if (!user) return NextResponse.json({ success: false, message: "User not found." });
    if (!user.email) {
        return NextResponse.json({ success: false, message: "No registered email was found for this account." });
    }

    const { otp, expiresAt } = saveAudioOtp(user.id);

    console.info(`Simulated audio upload OTP sent to email ${user.email}: ${otp}`);

    return NextResponse.json({
        success: true,
        deliveryMethod: "email",
        destination: user.email,
        expiresAt,
        // This is intentionally returned because this app has no real email provider.
        simulatedOtp: otp,
    });
}

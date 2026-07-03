import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { saveAudioOtp } from "@/utilities/audio/otp";
import { UserProps } from "@/types/UserProps";
import { sendEmail } from "@/utilities/email/sendEmail";

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

    await sendEmail({
        to: user.email,
        subject: "Twitter Clone - Audio Upload Verification",
        html: `
            <h2>Twitter Clone</h2>
            <h3>Audio Upload Verification</h3>
            <p>Your 6-digit OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP is required before posting a tweet containing audio.</p>
            <p>This OTP expires according to the existing verification flow.</p>
        `,
    });

    return NextResponse.json({
        success: true,
        message: "An audio verification code has been sent to your registered email.",
        expiresAt,
    });
}

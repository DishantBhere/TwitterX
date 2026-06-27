import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifyJwtToken } from "@/utilities/auth";
import { verifyAudioOtp } from "@/utilities/audio/otp";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    const { otp } = await request.json();

    if (!otp || !/^\d{6}$/.test(otp)) {
        return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." });
    }

    const token = cookies().get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You must be logged in to upload audio." });
    }

    return NextResponse.json(verifyAudioOtp(verifiedToken.id, otp));
}

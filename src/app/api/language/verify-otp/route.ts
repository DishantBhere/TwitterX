import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken } from "@/utilities/auth/jwt";
import { isSupportedLanguage } from "@/utilities/language";
import { verifyLanguageOtp } from "@/utilities/language/otp";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    const { language, otp } = await request.json();

    if (!language || !isSupportedLanguage(language)) {
        return NextResponse.json({ success: false, message: "Unsupported language." });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." });
    }

    const token = cookies().get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You must be logged in to change language." });
    }

    const verification = verifyLanguageOtp(verifiedToken.id, otp, language);
    if (!verification.success) return NextResponse.json(verification);

    const user = await prisma.user.update({
        where: { id: verifiedToken.id },
        data: { preferredLanguage: language },
    });

    const newToken = await createUserToken(user);
    const response = NextResponse.json({ success: true, preferredLanguage: user.preferredLanguage });
    response.cookies.set({
        name: "token",
        value: newToken,
        path: "/",
    });

    return response;
}

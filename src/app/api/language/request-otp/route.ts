import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { isSupportedLanguage, languageLabels } from "@/utilities/language";
import { saveLanguageOtp } from "@/utilities/language/otp";
import { UserProps } from "@/types/UserProps";
import { sendEmail } from "@/utilities/email/sendEmail";

export async function POST(request: NextRequest) {
    try {
        const { language } = await request.json();

        if (!language || !isSupportedLanguage(language)) {
            return NextResponse.json({ success: false, message: "Unsupported language." });
        }

        const token = cookies().get("token")?.value;
        const verifiedToken: UserProps = token && (await verifyJwtToken(token, request.nextUrl.origin));

        if (!verifiedToken) {
            return NextResponse.json({ success: false, message: "You must be logged in to change language." });
        }

        const user = await prisma.user.findUnique({
            where: { id: verifiedToken.id },
            select: { id: true, email: true, phone: true, preferredLanguage: true },
        });

        if (!user) return NextResponse.json({ success: false, message: "User not found." });
        if (user.preferredLanguage === language) {
            return NextResponse.json({ success: false, message: "This language is already selected." });
        }

        const sendToEmail = language === "fr";
        const destination = sendToEmail ? user.email : user.phone;

        if (!destination) {
            return NextResponse.json({
                success: false,
                message: `No registered ${sendToEmail ? "email" : "phone number"} was found for this account.`,
            });
        }

        const { otp, expiresAt } = saveLanguageOtp(user.id, language);

        if (sendToEmail) {
            try {
                await sendEmail({
                    to: destination,
                    subject: "Twitter Clone - Language Verification OTP",
                    html: `
                    <h2>Twitter Clone</h2>
                    <h3>Language Verification</h3>
                    <p>Your 6-digit OTP is:</p>
                    <h1>${otp}</h1>
                    <p>This OTP expires according to the existing verification flow.</p>
                `,
                });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unable to send language verification email.";
                return NextResponse.json({ success: false, message });
            }
        } else {
            console.info(
                `Simulated language OTP for ${languageLabels[language]} sent to ${sendToEmail ? "email" : "phone"} ${destination}: ${otp}`
            );
        }

        return NextResponse.json({
            success: true,
            deliveryMethod: sendToEmail ? "email" : "phone",
            destination,
            expiresAt,
            // This is intentionally returned because this app has no real email/SMS provider.
            simulatedOtp: otp,
        });
    } catch (error) {
        console.error("LANGUAGE OTP ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

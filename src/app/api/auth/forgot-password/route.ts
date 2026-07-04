import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords, hashPassword } from "@/utilities/bcrypt";
import { sendEmail } from "@/utilities/email/sendEmail";
import {
    consumeForgotPasswordToken,
    getForgotPasswordPending,
    saveForgotPasswordOtp,
    verifyForgotPasswordOtp,
} from "@/utilities/auth/forgot-password-otp";

const isToday = (date: Date) => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const normalizeIdentifier = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const makePassword = (length = 12) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let password = "";

    for (let index = 0; index < length; index += 1) {
        password += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    return password;
};

export async function POST(request: NextRequest) {
    const body = await request.json();
    const action = normalizeIdentifier(body.action);
    const identifier = normalizeIdentifier(body.identifier);
    const otp = normalizeIdentifier(body.otp);
    const newPassword = normalizeIdentifier(body.newPassword);
    const resetToken = normalizeIdentifier(body.resetToken);

    if (!identifier) {
        return NextResponse.json({ success: false, message: "Email or phone is required." });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { phone: identifier }],
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." });
        }

        if (action === "request") {
            const isDevelopment = process.env.NODE_ENV === "development";

            if (!isDevelopment && user.lastPasswordResetAt && isToday(user.lastPasswordResetAt)) {
                return NextResponse.json({
                    success: false,
                    message: "You can use this option only one time per day.",
                });
            }

            if (!user.email) {
                return NextResponse.json({ success: false, message: "No registered email was found for this account." });
            }

            const { otp: resetOtp, expiresAt } = saveForgotPasswordOtp(user.id);

            await sendEmail({
                to: user.email,
                subject: "Twitter Clone - Password Reset OTP",
                html: `
                    <h2>Twitter Clone</h2>
                    <h3>Password Reset Verification</h3>
                    <p>Your 6-digit OTP is:</p>
                    <h1>${resetOtp}</h1>
                    <p>This OTP expires according to the existing verification flow.</p>
                `,
            });

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                message: "A verification code has been sent to your registered email.",
                expiresAt,
            });
        }

        if (action === "verify") {
            if (!otp || !/^\d{6}$/.test(otp)) {
                return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." });
            }

            const verification = verifyForgotPasswordOtp(user.id, otp);
            if (!verification.success || !verification.pending) {
                return NextResponse.json(verification);
            }

            console.log("[forgot-password] verified userId:", verification.pending.userId);
            console.log("[forgot-password] verified email:", user.email);
            console.log("[forgot-password] verified username:", user.username);

            return NextResponse.json({
                success: true,
                resetToken: verification.pending.resetToken,
                userId: verification.pending.userId,
            });
        }

        if (action === "reset") {
            const pending = getForgotPasswordPending(body.userId);

            if (!resetToken) {
                return NextResponse.json({ success: false, message: "Reset session is invalid." });
            }
            if (!newPassword) {
                return NextResponse.json({ success: false, message: "New password is required." });
            }
            if (!body.userId || !pending) {
                return NextResponse.json({ success: false, message: "Reset session is invalid." });
            }

            const currentUser = await prisma.user.findUnique({
                where: {
                    id: body.userId,
                },
            });

            console.log("[forgot-password] reset userId:", body.userId);
            console.log("[forgot-password] reset email:", currentUser?.email);
            console.log("[forgot-password] reset username:", currentUser?.username);
            console.log("[forgot-password] old password hash:", currentUser?.password);
            console.log("[forgot-password] hashPassword() called:", true);

            const hashedPassword = await hashPassword(newPassword);
            console.log("[forgot-password] new password hash before update:", hashedPassword);

            const updateResult = await prisma.user.update({
                where: {
                    id: body.userId,
                },
                data: {
                    password: hashedPassword,
                    lastPasswordResetAt: new Date(),
                },
            });

            console.log("[forgot-password] prisma.user.update() result:", updateResult);

            const rereadUser = await prisma.user.findUnique({
                where: {
                    id: body.userId,
                },
            });

            console.log("[forgot-password] reread password hash after update:", rereadUser?.password);
            console.log("[forgot-password] saved hash changed:", currentUser?.password !== rereadUser?.password);
            console.log("[forgot-password] comparePasswords(newPassword, savedHash):", await comparePasswords(newPassword, rereadUser?.password ?? ""));

            const tokenCheck = consumeForgotPasswordToken(body.userId, resetToken);
            if (!tokenCheck.success) {
                return NextResponse.json(tokenCheck);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "Invalid request." });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return NextResponse.json({ success: false, message });
    }
}

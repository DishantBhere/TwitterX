import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { hashPassword } from "@/utilities/bcrypt";
import { createUserToken } from "@/utilities/auth/jwt";
import { sendEmail } from "@/utilities/email/sendEmail";
import { saveSignupOtp, verifySignupOtp } from "@/utilities/auth/signup-otp";

export async function POST(request: NextRequest) {
    const userData = await request.json();
    const username = userData.username?.trim();
    const email = userData.email?.trim();
    const phone = userData.phone?.trim();
    const name = userData.name?.trim() || null;
    const otp = userData.otp?.trim();
    const signupKey = email || username;

    if (!username || !userData.password || !email || !phone) {
        return NextResponse.json({
            success: false,
            message: "Username, password, email and phone are required.",
        });
    }

    const hashedPassword = await hashPassword(userData.password);
    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    try {
        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email },
                    { phone },
                ],
            },
        });

        if (userExists) {
            const duplicateField =
                userExists.username === username
                    ? "Username"
                    : userExists.email === email
                    ? "Email"
                    : "Phone";
            return NextResponse.json({
                success: false,
                message: `${duplicateField} already exists.`,
            });
        }

        if (!otp) {
            const { otp: signupOtp } = saveSignupOtp(signupKey, {
                username,
                password: userData.password,
                email,
                phone,
                name,
                browserNotificationsEnabled: userData.browserNotificationsEnabled ?? false,
            });

            await sendEmail({
                to: email,
                subject: "Twitter Clone - Email Verification",
                html: `
                    <h2>Twitter Clone</h2>
                    <p>Your verification OTP is:</p>
                    <h1>${signupOtp}</h1>
                    <p>This code expires according to the existing verification flow.</p>
                `,
            });

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                message: "A verification code has been sent to your email.",
            });
        }

        const verification = verifySignupOtp(signupKey, otp);
        if (!verification.success || !verification.pending) {
            return NextResponse.json(verification);
        }

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                phone,
                name,
                password: hashedPassword,
                browserNotificationsEnabled: userData.browserNotificationsEnabled ?? false,
            },
        });

        await prisma.notification.create({
            data: {
                userId: newUser.id,
                type: "welcome",
                content: JSON.stringify(null),
            },
        });

        const token = await createUserToken(newUser);

        const response = NextResponse.json({
            success: true,
        });
        response.cookies.set({
            name: "token",
            value: token,
            path: "/",
        });

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return NextResponse.json({ success: false, message });
    }
}

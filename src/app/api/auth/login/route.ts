import { NextResponse, NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords } from "@/utilities/bcrypt";
import { createUserToken } from "@/utilities/auth/jwt";
import { saveLoginOtp } from "@/utilities/auth/login-otp";
import { sendEmail } from "@/utilities/email/sendEmail";
import { getLoginContext } from "@/utilities/auth/shared";

export async function POST(request: NextRequest) {
    const { username, password } = await request.json();

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: username,
            },
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "Username or password is not correct.",
            });
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                message: "Username or password is not correct.",
            });
        }

        const { browser, operatingSystem, deviceType, ipAddress } = getLoginContext(
            request.headers.get("user-agent") || "",
            request.headers.get("x-forwarded-for") || "",
            request.ip
        );

        const getCurrentIstMinutes = () => {
            const parts = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).formatToParts(new Date());

            const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
            const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
            return hour * 60 + minute;
        };

        if (deviceType === "Mobile") {
            const currentIstMinutes = getCurrentIstMinutes();
            const startMinutes = 10 * 60;
            const endMinutes = 13 * 60;

            if (currentIstMinutes < startMinutes || currentIstMinutes > endMinutes) {
                return NextResponse.json({
                    success: false,
                    message: "Mobile login is allowed only between 10:00 AM and 1:00 PM IST.",
                });
            }
        }

        if (browser === "Chrome") {
            if (!user.email) {
                return NextResponse.json({ success: false, message: "No registered email was found for this account." });
            }

            const { otp, expiresAt } = saveLoginOtp({
                userId: user.id,
                browser,
                operatingSystem,
                deviceType,
                ipAddress,
            });

            await sendEmail({
                to: user.email,
                subject: "Twitter Clone - Login Verification",
                html: `
                    <h2>Twitter Clone</h2>
                    <h3>Login Verification</h3>
                    <p>Your 6-digit OTP is:</p>
                    <h1>${otp}</h1>
                    <p>This OTP expires according to the existing login OTP flow.</p>
                `,
            });

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                message: "A verification code has been sent to your registered email.",
                expiresAt,
                username: user.username,
            });
        }

        const token = await createUserToken(user);

        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                browser,
                operatingSystem,
                deviceType,
                ipAddress,
                loginTime: new Date(),
            },
        });

        const response = NextResponse.json({
            success: true,
        });

        response.cookies.set({
            name: "token",
            value: token,
            path: "/",
        });

        return response;

    } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json({
        success: false,
        message: "Login failed.",
    });
}
}

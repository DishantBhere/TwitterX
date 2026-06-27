import { NextResponse, NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords } from "@/utilities/bcrypt";
import { createUserToken } from "@/utilities/auth/jwt";
import { saveLoginOtp } from "@/utilities/auth/login-otp";

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

        const userAgent = request.headers.get("user-agent") || "";
        const forwardedFor = request.headers.get("x-forwarded-for") || "";
        const ipAddress = forwardedFor.split(",")[0]?.trim() || request.ip || "unknown";

        const detectBrowser = (ua: string) => {
            if (/Edg\//i.test(ua)) return "Edge";
            if (/Firefox\//i.test(ua)) return "Firefox";
            if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return "Chrome";
            if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Safari";
            if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
            return "Unknown";
        };

        const detectOperatingSystem = (ua: string) => {
            if (/Windows NT/i.test(ua)) return "Windows";
            if (/Android/i.test(ua)) return "Android";
            if (/(iPhone|iPad|iPod)/i.test(ua)) return "iOS";
            if (/Mac OS X/i.test(ua)) return "macOS";
            if (/Linux/i.test(ua)) return "Linux";
            return "Unknown";
        };

        const detectDeviceType = (ua: string, operatingSystem: string) => {
            if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
                return "Mobile";
            }

            if (operatingSystem === "macOS") {
                return "Laptop";
            }

            return "Desktop";
        };

        const browser = detectBrowser(userAgent);
        const operatingSystem = detectOperatingSystem(userAgent);
        const deviceType = detectDeviceType(userAgent, operatingSystem);

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

            console.info(`Simulated Chrome login OTP sent to email ${user.email}: ${otp}`);

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                deliveryMethod: "email",
                destination: user.email,
                expiresAt,
                simulatedOtp: otp,
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

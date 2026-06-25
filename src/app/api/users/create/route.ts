import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

import { prisma } from "@/prisma/client";
import { hashPassword } from "@/utilities/bcrypt";
import { getJwtSecretKey } from "@/utilities/auth";

export async function POST(request: NextRequest) {
    const userData = await request.json();
    const username = userData.username?.trim();
    const email = userData.email?.trim();
    const phone = userData.phone?.trim();
    const name = userData.name?.trim() || null;

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

        const token = await new SignJWT({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            name: newUser.name,
            description: newUser.description,
            location: newUser.location,
            website: newUser.website,
            isPremium: newUser.isPremium,
            browserNotificationsEnabled: newUser.browserNotificationsEnabled,
            createdAt: newUser.createdAt,
            photoUrl: newUser.photoUrl,
            headerUrl: newUser.headerUrl,
        })
            .setProtectedHeader({
                alg: "HS256",
            })
            .setIssuedAt()
            .setExpirationTime("1d")
            .sign(getJwtSecretKey());

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

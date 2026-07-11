import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotification } from "@/utilities/fetch";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const tokenOwnerId = await request.json();

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token, request.nextUrl.origin));

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.id !== tokenOwnerId)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    try {
        const recipientUser = await prisma.user.findUnique({
            where: {
                username: username,
            },
            select: {
                id: true,
            },
        });

        if (!recipientUser) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." });
        }

        await prisma.user.update({
            where: {
                username: username,
            },
            data: {
                followers: {
                    connect: {
                        id: tokenOwnerId,
                    },
                },
            },
        });

        const notificationContent = {
            sender: {
                username: verifiedToken.username,
                name: verifiedToken.name,
                photoUrl: verifiedToken.photoUrl,
            },
            content: null,
        };

        await createNotification(recipientUser.id, "follow", secret, notificationContent);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

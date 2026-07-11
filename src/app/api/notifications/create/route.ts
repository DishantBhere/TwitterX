import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { NotificationProps } from "@/types/NotificationProps";

export async function POST(request: NextRequest) {
    const { recipientId, recipient, type, secret, notificationContent }: NotificationProps & { recipientId?: string } = await request.json();

    if (secret !== process.env.CREATION_SECRET_KEY) {
        return NextResponse.json({ success: false, error: "Invalid secret." });
    }

    const resolvedRecipientId = recipientId;
    const resolvedRecipientUsername = recipient;

    if (!resolvedRecipientId && !resolvedRecipientUsername) {
        return NextResponse.json({ success: false, error: "Recipient is required." });
    }

    try {
        await prisma.notification.create({
            data: {
                user: {
                    connect: resolvedRecipientId ? { id: resolvedRecipientId } : { username: resolvedRecipientUsername as string },
                },
                type: type,
                content: JSON.stringify(notificationContent),
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

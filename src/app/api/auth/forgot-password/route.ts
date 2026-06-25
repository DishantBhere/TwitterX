import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { hashPassword } from "@/utilities/bcrypt";

const PASSWORD_LENGTH = 10;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const buildRandomPassword = (): string => {
    let password = "";
    for (let i = 0; i < PASSWORD_LENGTH; i += 1) {
        password += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    return password;
};

const isToday = (date: Date) => {
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
};

export async function POST(request: NextRequest) {
    const { identifier: rawIdentifier } = await request.json();
    const identifier = rawIdentifier?.trim();

    if (!identifier) {
        return NextResponse.json({ success: false, message: "Identifier is required." });
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

        if (user.lastPasswordResetAt && isToday(user.lastPasswordResetAt)) {
            return NextResponse.json({
                success: false,
                message: "You can use this option only one time per day.",
            });
        }

        const newPassword = buildRandomPassword();
        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
                lastPasswordResetAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, password: newPassword });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return NextResponse.json({ success: false, message });
    }
}

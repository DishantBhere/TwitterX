import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken } from "@/utilities/auth/jwt";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const data = await request.json();

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.username !== username)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    const { preferredLanguage: _preferredLanguage, ...safeData } = data;

    try {
        const user = await prisma.user.update({
            where: {
                username: username,
            },
            data: safeData,
        });

        const newToken = await createUserToken(user);

        const response = NextResponse.json({
            success: true,
        });
        response.cookies.set({
            name: "token",
            value: newToken,
            path: "/",
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

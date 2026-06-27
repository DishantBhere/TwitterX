import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

export async function GET() {
    try {
        const token = cookies().get("token")?.value;
        const verifiedToken: VerifiedToken = token && (await verifyJwtToken(token));

        if (!verifiedToken) {
            return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
        }

        const loginHistory = await prisma.loginHistory.findMany({
            where: {
                userId: verifiedToken.id,
            },
            orderBy: {
                loginTime: "desc",
            },
            select: {
                browser: true,
                operatingSystem: true,
                deviceType: true,
                ipAddress: true,
                loginTime: true,
            },
        });

        return NextResponse.json({ success: true, loginHistory });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

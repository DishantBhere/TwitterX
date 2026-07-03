import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@/utilities/email/sendEmail";

export async function POST(request: NextRequest) {
    try {
        const { to } = await request.json();

        if (!to || typeof to !== "string") {
            return NextResponse.json(
                { success: false, message: "The 'to' field is required." },
                { status: 400 }
            );
        }

        await sendEmail({
            to,
            subject: "Twitter Clone Test Email",
            html: `
                <h2>Nodemailer is working!</h2>
                <p>This is a test email from the Twitter Clone project.</p>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("TEST EMAIL ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

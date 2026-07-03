import { transporter } from "./transporter";

type SendEmailParams = {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
    }>;
};

export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        attachments,
    });
}

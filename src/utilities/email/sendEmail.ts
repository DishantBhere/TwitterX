import { transporter } from "./transporter";

type SendEmailParams = {
    to: string;
    subject: string;
    html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
}

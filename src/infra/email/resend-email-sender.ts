import { Resend } from "resend";
import { MailSender, SendEmailInput } from "./mail-sender";
import { env } from "@/env";

export class ResendEmailSender implements MailSender {
    private readonly client = new Resend(env.RESEND_API_KEY);

    async send(input: SendEmailInput): Promise<void> {
        const { error } = await this.client.emails.send({
            from: env.EMAIL_FROM,
            to: input.to,
            subject: input.subject,
            html: input.html,
        });

        if (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}

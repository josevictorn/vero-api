import * as nodemailer from "nodemailer";
import { MailSender, SendEmailInput } from "./mail-sender";
import { env } from "@/env";

export class NodemailerEmailSender implements MailSender {
    private transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD
        }
    });

    async send(input: SendEmailInput): Promise<void> {
        await this.transport.sendMail({
            from: env.EMAIL_FROM,
            to: input.to,
            subject: input.subject,
            html: input.html,
        }); 
    }
}

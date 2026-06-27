import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { MailSender, SendEmailInput } from "./mail-sender";
import { env } from "@/env";

const smtpOptions: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
    }
};

export class NodemailerEmailSender implements MailSender {
    private transport = nodemailer.createTransport(smtpOptions);

    async send(input: SendEmailInput): Promise<void> {
        await this.transport.sendMail({
            from: env.EMAIL_FROM,
            to: input.to,
            subject: input.subject,
            html: input.html,
        }); 
    }
}

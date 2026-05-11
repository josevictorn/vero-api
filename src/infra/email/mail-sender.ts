export interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

export interface MailSender {
    send(input: SendEmailInput): Promise<void>;
}

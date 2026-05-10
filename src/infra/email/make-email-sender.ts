import { NodemailerEmailSender } from "./nodemailer-email-sender";

export function makeEmailSender() {
    return new NodemailerEmailSender();
}

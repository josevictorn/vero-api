import { NodemailerEmailGateway } from "./nodemailer-email-sender";

export function makeEmailSender() {
    return new NodemailerEmailGateway();
}

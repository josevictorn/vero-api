import { PrismaPasswordResetTokensRepository } from "@/core/repositories/prisma/prisma-password-reset-tokens-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { ForgotPasswordUseCase } from "../forgot-pasword";
import { makeEmailSender } from "@/infra/email/make-email-sender";

export function makeForgotPasswordUseCase() {
    const usersRepository = new PrismaUsersRepository();
    const passwordResetTokensRepository = new PrismaPasswordResetTokensRepository();
    const emailSender = makeEmailSender();

    return new ForgotPasswordUseCase(
        usersRepository,
        passwordResetTokensRepository,
        emailSender
    );
}

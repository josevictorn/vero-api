import {makeEmailGateway} from "@/infra/google/email/make-email-gateway";
import {PrismaPasswordResetTokensRepository} from "@/repositories/prisma/prisma-password-reset-tokens-repository";
import {PrismaUsersRepository} from "@/repositories/prisma/prisma-users-repository";
import {ForgotPasswordUseCase} from "../forgot-pasword";

export function makeForgotPasswordUseCase() {
    const usersRepository = new PrismaUsersRepository();
    const passwordResetTokensRepository = new PrismaPasswordResetTokensRepository();
    const emailGateway = makeEmailGateway();

    return new ForgotPasswordUseCase(
        usersRepository,
        passwordResetTokensRepository,
        emailGateway
    );
}

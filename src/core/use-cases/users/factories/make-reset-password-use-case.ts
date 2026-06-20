import { PrismaPasswordResetTokensRepository } from "@/core/repositories/prisma/prisma-password-reset-tokens-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { ResetPasswordUseCase } from "../reset-pasword";

export function makeResetPasswordUseCase() {
    const usersRepository = new PrismaUsersRepository();
    const passwordResetTokensRepository = new PrismaPasswordResetTokensRepository();

    return new ResetPasswordUseCase(
        usersRepository,
        passwordResetTokensRepository
    );
}

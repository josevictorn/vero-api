import { type Either, left, right } from "@utils/either";
import { InvalidOrExpiredToken } from "./errors/invalid-or-expired-token-error";
import { createHash } from "node:crypto";
import { hash } from "argon2";
import { UsersRepository } from "@/core/repositories/users-repository";
import { PasswordResetTokensRepository } from "@/core/repositories/password-reset-tokens-repository";

const MINMUM_PASSWORD_LENGTH = 6;

interface ResetPasswordUseCaseRequest {
    token: string;
    newPassword: string;
}

type ResetPasswordUseCaseResponse = Either<
    InvalidOrExpiredToken, 
    { message: string }
>;

export class ResetPasswordUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly passwordResetTokensRepository: PasswordResetTokensRepository,
    ) {}
    
    async execute({ token , newPassword }: ResetPasswordUseCaseRequest): Promise<ResetPasswordUseCaseResponse> {
        if (newPassword.length < MINMUM_PASSWORD_LENGTH) {
            return left(new InvalidOrExpiredToken());
        }

        const tokenHash = createHash("sha256").update(token).digest("hex");

        const resetToken = await this.passwordResetTokensRepository.findByToken(tokenHash);

        if (!resetToken || resetToken.usedAt != null || resetToken.expiresAt < new Date()) {
            return left(new InvalidOrExpiredToken());
        }

        await this.passwordResetTokensRepository.markAsUsed(resetToken.id);

        const user = await this.usersRepository.findById(resetToken.userId);

        if (!user) {
            return left(new InvalidOrExpiredToken());
        }

        await this.usersRepository.save({
            ...user,
            password_hash: await hash(newPassword),
        });

        return right({ message: "Password updated successfully."});
    }
}

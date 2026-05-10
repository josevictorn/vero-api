import { MailSender } from "@/infra/email/mail-sender";
import { PasswordResetTokensRepository } from "@/repositories/password-reset-tokens-repository";
import { UsersRepository } from "@/repositories/users-repository";
import { type Either, right } from "@/utils/either";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_TTL_MS = 1000 * 60 * 15;

interface ForgotPasswordUseCaseRequest {
    email: string;
}

type ForgotPasswordUseCaseResponse = Either<never, { message: string }>;

export class ForgotPasswordUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly passwordResetTokensRepository: PasswordResetTokensRepository,
        private readonly emailSender: MailSender,
    ) {}

    async execute({ email }: ForgotPasswordUseCaseRequest): Promise<ForgotPasswordUseCaseResponse> {
        const user = await this.usersRepository.findByEmail(email);

        if (!user) {
            return right({
                message: "If this email is registred, you will receive recovery instructions.",
            });
        }

        await this.passwordResetTokensRepository.deleteByUserId(user.id);

        const rawToken = randomBytes(32).toString("hex");

        const tokenHash = createHash("sha256").update(rawToken).digest("hex");

        await this.passwordResetTokensRepository.create({
            userId: user.id,
            token: tokenHash,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        });

        await this.emailSender.send({
            to: user.email,
            subject: "Reperação de senha - Vero",
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2>Redefinição de senha</h2>
                  <p>Olá, <strong>${user.name}!</strong>.</p>
                  <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>15 minutos</strong>.</p>
                  <a href="${process.env.APP_URL}/reset-password?token=${rawToken}"
                     style="display:inline-block;padding:12px 24px;background:#000;color:#fff;
                            border-radius:6px;text-decoration:none;font-weight:bold;">
                    Redefinir minha senha
                  </a>
                  <p style="margin-top:24px;color:#666;font-size:13px;">
                    Se você não solicitou isso, ignore este email — sua senha permanece a mesma.
                  </p>
                </div>
            `
        });

        return right({
            message: "If this email is registered, you will receive recovery instructions.",
        });
    }
}

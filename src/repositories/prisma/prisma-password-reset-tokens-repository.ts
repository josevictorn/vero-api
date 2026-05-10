import { prisma } from "@/lib/prisma";
import type {
  CreatePasswordResetTokenData,
  PasswordResetTokensRepository,
} from "../password-reset-tokens-repository";

export class PrismaPasswordResetTokensRepository
  implements PasswordResetTokensRepository
{
  async create(data: CreatePasswordResetTokenData) {
    return prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  // Remove tokens anteriores antes de criar um novo — apenas um ativo por vez
  async deleteByUserId(userId: string) {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  }

  // Preenche usedAt — token não pode ser reutilizado após isso
  async markAsUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

import type { PasswordResetToken } from "@generated/prisma/client";

export interface CreatePasswordResetTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetTokensRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  deleteByUserId(userId: string): Promise<void>;
  markAsUsed(id: string): Promise<PasswordResetToken>;
}

import { CreatePasswordResetTokenData, PasswordResetTokensRepository } from "@/core/repositories/password-reset-tokens-repository";
import type { PasswordResetToken } from "@generated/prisma/client";
import { randomUUID } from "node:crypto";

export class InMemoryPasswordResetTokensRepository implements PasswordResetTokensRepository {
  public items: PasswordResetToken[] = [];

  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: randomUUID(),
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };

    this.items.push(token);

    return token;
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.items.find((t) => t.token === token) ?? null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.items = this.items.filter((t) => t.userId !== userId);
  }

  async markAsUsed(id: string): Promise<PasswordResetToken> {
    const token = this.items.find((t) => t.id === id);

    if (!token) 
        throw new Error(`Token ${id} not found`);

    token.usedAt = new Date();

    return token;
  }
}

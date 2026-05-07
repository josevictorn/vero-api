import { randomUUID } from "node:crypto";
import type { AiSession, Prisma } from "@generated/prisma/client";
import { AiSessionStatus } from "@generated/prisma/client";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryAiSessionRepository implements AiSessionRepository {
	private items: AiSession[] = [];

	async findById(id: string) {
		const aiSession = this.items.find((item) => item.id === id);

		if (!aiSession) {
			return null;
		}

		return aiSession;
	}

	async findByChatId(chatId: string) {
		const aiSession = this.items.find((item) => item.chatId === chatId);

		if (!aiSession) {
			return null;
		}

		return aiSession;
	}

	async create(data: Prisma.AiSessionUncheckedCreateInput) {
		const aiSession: AiSession = {
			id: randomUUID(),
			screeningFlowId: data.screeningFlowId ?? null,
			leadId: data.leadId ?? null,
			chatId: data.chatId,
			status: data.status ?? AiSessionStatus.IDENTIFYING,
			chatState: data.chatState as AiSession["chatState"],
			name: data.name,
			cellphone: data.cellphone,
			isThirdParty: data.isThirdParty ?? false,
			createdAt: new Date(),
		};

		this.items.push(aiSession);

		return aiSession;
	}

	async findMany(params: PaginationParams) {
		const aiSessions = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: aiSessions,
			total: this.items.length,
		};
	}

	async save(data: AiSession) {
		const aiSessionIndex = this.items.findIndex((item) => item.id === data.id);

		if (aiSessionIndex >= 0) {
			this.items[aiSessionIndex] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

import { randomUUID } from "node:crypto";
import type { Prisma, ScreeningFlow } from "@generated/prisma/client";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryScreeningFlowsRepository
	implements ScreeningFlowsRepository
{
	private items: ScreeningFlow[] = [];

	async findById(id: string) {
		const screeningFlow = this.items.find((item) => item.id === id);

		if (!screeningFlow) {
			return null;
		}

		return screeningFlow;
	}

	async create(data: Prisma.ScreeningFlowCreateInput) {
		const screeningFlow: ScreeningFlow = {
			id: randomUUID(),
			caseType: data.caseType,
			questions: data.questions as Prisma.JsonValue,
			createdAt: new Date(),
		};

		this.items.push(screeningFlow);

		return screeningFlow;
	}

	async findMany(params: PaginationParams) {
		const screeningFlows = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: screeningFlows,
			total: this.items.length,
		};
	}

	async save(data: ScreeningFlow) {
		const screeningFlowIndex = this.items.findIndex(
			(item) => item.id === data.id
		);

		if (screeningFlowIndex >= 0) {
			this.items[screeningFlowIndex] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

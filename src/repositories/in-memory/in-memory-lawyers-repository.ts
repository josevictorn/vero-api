import { randomUUID } from "node:crypto";
import type { Lawyer, Prisma } from "@generated/prisma/client";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryLawyersRepository implements LawyersRepository {
	private items: Lawyer[] = [];

	async findById(id: string) {
		const lawyer = this.items.find((item) => item.id === id);

		if (!lawyer) {
			return null;
		}

		return lawyer;
	}

	async findByUserId(userId: string) {
		const lawyer = this.items.find((item) => item.userId === userId);

		if (!lawyer) {
			return null;
		}

		return lawyer;
	}

	async create(data: Prisma.LawyerUncheckedCreateInput) {
		const lawyer = {
			id: randomUUID(),
			userId: data.userId,
			workspaceId: data.workspaceId,
			cellphone: data.cellphone,
			createdAt: new Date(),
		};

		this.items.push(lawyer);

		return lawyer;
	}

	async findMany(params: PaginationParams) {
		const lawyers = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: lawyers,
			total: this.items.length,
		};
	}

	async save(data: Lawyer) {
		const lawyerIndex = this.items.findIndex((item) => item.id === data.id);

		if (lawyerIndex >= 0) {
			this.items[lawyerIndex] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

import { randomUUID } from "node:crypto";
import type { Lead, Prisma } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { LeadsRepository } from "@/core/repositories/leads-repository";

export class InMemoryLeadsRepository implements LeadsRepository {
	private items: Lead[] = [];

	async findById(id: string) {
		const lead = this.items.find((item) => item.id === id);

		if (!lead) {
			return null;
		}

		return lead;
	}

	async create(data: Prisma.LeadUncheckedCreateInput) {
		const lead = {
			id: randomUUID(),
			workspaceId: data.workspaceId,
			lawyerId: data.lawyerId ?? null,
			name: data.name,
			cellphone: data.cellphone,
			email: data.email as string | null,
			status: data.status ?? "NEW_LEAD",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(lead);

		return lead;
	}

	async findMany(params: PaginationParams) {
		const leads = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: leads,
			total: this.items.length,
		};
	}

	async save(data: Lead) {
		const leadIndex = this.items.findIndex((item) => item.id === data.id);

		if (leadIndex >= 0) {
			this.items[leadIndex] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

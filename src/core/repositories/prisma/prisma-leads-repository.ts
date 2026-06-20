import type { Lead, Prisma } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { LeadsRepository } from "@/core/repositories/leads-repository";

export class PrismaLeadsRepository implements LeadsRepository {
	async findById(id: string) {
		const lead = await prisma.lead.findUnique({
			where: { id },
		});

		return lead;
	}

	async create(data: Prisma.LeadUncheckedCreateInput) {
		const lead = await prisma.lead.create({
			data,
		});

		return lead;
	}

	async findMany(params: PaginationParams) {
		const [leads, total] = await prisma.$transaction([
			prisma.lead.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.lead.count(),
		]);

		return {
			items: leads,
			total,
		};
	}

	async save(data: Lead) {
		const updatedLead = await prisma.lead.update({
			where: { id: data.id },
			data,
		});

		return updatedLead;
	}

	async delete(id: string) {
		await prisma.lead.delete({
			where: { id },
		});
	}
}

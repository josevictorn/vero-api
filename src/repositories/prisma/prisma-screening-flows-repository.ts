import type { Prisma, ScreeningFlow } from "@generated/prisma/client";
import type { ScreeningFlowsRepository } from "@repositories/screening-flows-repository";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class PrismaScreeningFlowsRepository
	implements ScreeningFlowsRepository
{
	async findById(id: string) {
		const screeningFlow = await prisma.screeningFlow.findUnique({
			where: { id },
		});

		return screeningFlow;
	}

	async create(data: Prisma.ScreeningFlowCreateInput) {
		const screeningFlow = await prisma.screeningFlow.create({
			data,
		});

		return screeningFlow;
	}

	async findMany(params: PaginationParams) {
		const [screeningFlows, total] = await prisma.$transaction([
			prisma.screeningFlow.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.screeningFlow.count(),
		]);

		return {
			items: screeningFlows,
			total,
		};
	}

	async save(data: ScreeningFlow) {
		const updatedScreeningFlow = await prisma.screeningFlow.update({
			where: { id: data.id },
			data: {
				caseType: data.caseType,
				questions: data.questions as Prisma.InputJsonValue,
			},
		});

		return updatedScreeningFlow;
	}

	async delete(id: string) {
		await prisma.screeningFlow.delete({
			where: { id },
		});
	}
}

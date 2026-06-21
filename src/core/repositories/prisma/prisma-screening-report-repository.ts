import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";
import type { Prisma, ScreeningReport } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { ScreeningReportRepository } from "../screening-report-repository";

export class PrismaScreeningReportRepository implements ScreeningReportRepository {

	async create(data: Prisma.ScreeningReportUncheckedCreateInput): Promise<ScreeningReport> {
		return prisma.screeningReport.create({ data });
	}

	async findById(id: string): Promise<ScreeningReport | null> {
		return prisma.screeningReport.findUnique({ where: { id } });
	}

	async findMany(params: PaginationParams): Promise<PaginatedResult<ScreeningReport>> {
		const [reports, total] = await prisma.$transaction([
			prisma.screeningReport.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: { createdAt: "desc" },
			}),
			prisma.screeningReport.count(),
		]);

		return { items: reports, total };
	}

	async save(report: ScreeningReport): Promise<ScreeningReport> {
		const { id, createdAt, updatedAt, data, ...rest } = report;
		return prisma.screeningReport.update({
			where: { id },
			data: {
				...rest,
				data: data as Prisma.InputJsonValue,
			},
		});
	}

	async delete(id: string): Promise<void> {
		await prisma.screeningReport.delete({ where: { id } });
	}
}

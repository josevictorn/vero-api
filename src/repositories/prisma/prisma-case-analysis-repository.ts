import { PaginatedResult } from "@/utils/paginated-results";
import { PaginationParams } from "@/utils/pagination-params";
import { CaseAnalysis } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CaseAnalysisUncheckedCreateInput } from "@generated/prisma/models";
import { CaseAnalysisRepository } from "../case-analysis-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";


export class PrismaCaseAnalysisRepository implements CaseAnalysisRepository {

    async create(data: CaseAnalysisUncheckedCreateInput): Promise<CaseAnalysis> {
        const caseAnalysis = await prisma.caseAnalysis.create({
            data
        });

        return caseAnalysis;
    }

    async delete(id: string): Promise<void> {
        await prisma.caseAnalysis.delete({
            where : { id }
        });

    }

    async findById(id: string): Promise<CaseAnalysis | null> {
        const caseAnalysis = await prisma.caseAnalysis.findUnique({
            where: { id }
        });

        return caseAnalysis;
    }

    async findMany(params: PaginationParams): Promise<PaginatedResult<CaseAnalysis>> {
        const [caseAnalysis, total] = await prisma.$transaction([
            prisma.caseAnalysis.findMany({
                skip: (params.page - 1) * ITEM_PER_PAGE,
                take: ITEM_PER_PAGE,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.caseAnalysis.count(),
        ])  

        return {
            items: caseAnalysis,
            total
        };
    }

    async save(CaseAnalysis: CaseAnalysis): Promise<CaseAnalysis> {
        const updatedCaseAnalysis = await prisma.caseAnalysis.update({
            where: { id: CaseAnalysis.id },
            data: CaseAnalysis,
        });

        return updatedCaseAnalysis;
    }

}
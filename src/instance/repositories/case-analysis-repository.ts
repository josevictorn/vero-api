import { PaginatedResult } from "@/utils/paginated-results";
import { PaginationParams } from "@/utils/pagination-params";
import { Prisma, CaseAnalysis } from "@generated/prisma/client";


export interface CaseAnalysisRepository {
    create(data: Prisma.CaseAnalysisUncheckedCreateInput): Promise<CaseAnalysis>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<CaseAnalysis | null>;
    findMany(params: PaginationParams): Promise<PaginatedResult<CaseAnalysis>>;
    save(CaseAnalysis: CaseAnalysis): Promise<CaseAnalysis>;
}
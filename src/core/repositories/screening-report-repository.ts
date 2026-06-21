import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";
import type { Prisma, ScreeningReport } from "@generated/prisma/client";

/**
 * Repositório genérico para relatórios de triagem.
 *
 * O campo `data` é um Json livre — cada instância define sua estrutura
 * (ex: análise jurídica, ficha médica, orçamento de obra).
 */
export interface ScreeningReportRepository {
	create(data: Prisma.ScreeningReportUncheckedCreateInput): Promise<ScreeningReport>;
	findById(id: string): Promise<ScreeningReport | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<ScreeningReport>>;
	save(report: ScreeningReport): Promise<ScreeningReport>;
	delete(id: string): Promise<void>;
}

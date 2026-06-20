import type { Prisma, ScreeningFlow } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface ScreeningFlowsRepository {
	create(data: Prisma.ScreeningFlowCreateInput): Promise<ScreeningFlow>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<ScreeningFlow | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<ScreeningFlow>>;
	save(screeningFlow: ScreeningFlow): Promise<ScreeningFlow>;
}

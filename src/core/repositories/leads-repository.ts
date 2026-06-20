import type { Lead, Prisma } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface LeadsRepository {
	create(data: Prisma.LeadUncheckedCreateInput): Promise<Lead>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Lead | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<Lead>>;
	save(lead: Lead): Promise<Lead>;
}

import type { Lawyer, Prisma } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface LawyersRepository {
	create(data: Prisma.LawyerUncheckedCreateInput): Promise<Lawyer>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Lawyer | null>;
	findByUserId(userId: string): Promise<Lawyer | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<Lawyer>>;
	save(lawyer: Lawyer): Promise<Lawyer>;
}

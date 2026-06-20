import type { Client, Prisma } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface ClientsRepository {
	create(data: Prisma.ClientUncheckedCreateInput): Promise<Client>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Client | null>;
	findByLeadId(leadId: string): Promise<Client | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<Client>>;
	save(client: Client): Promise<Client>;
}

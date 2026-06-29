import type { Client, Prisma } from "@generated/prisma/client";
import type { PaginationParams } from "@/utils/pagination-params";

/**
 * Interface do repositório de clientes (instância de advocacia).
 * Usada internamente pelo `LawFirmDomainEntityPort`.
 */
export interface ClientsRepository {
	findById(id: string): Promise<Client | null>;
	findByLeadId(leadId: string): Promise<Client | null>;
	create(data: Prisma.ClientUncheckedCreateInput): Promise<Client>;
	findMany(params: PaginationParams): Promise<{ items: Client[]; total: number }>;
	save(data: Client): Promise<Client>;
	delete(id: string): Promise<void>;
}

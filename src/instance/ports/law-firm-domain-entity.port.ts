import { left, right } from "@/utils/either";
import type { Either } from "@/utils/either";
import type {
	DomainEntityPort,
	DomainEntity,
	DomainEntityResult,
	CreateFromScreeningInput,
} from "@/core/ports/domain-entity.port";
import type { PaginationParams } from "@/utils/pagination-params";
import type { PaginatedResult } from "@/utils/paginated-results";
import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";

/**
 * Implementação do `DomainEntityPort` para escritórios de advocacia.
 * A entidade de domínio é o `Client` (cliente do escritório).
 *
 * - `createFromScreening()`: Cria um Client preliminar com os dados do Lead.
 *   Campos complementares (CPF, RG, endereço, etc.) são opcionais no schema
 *   e preenchidos posteriormente pelo advogado via `PUT /entities/:id`.
 *
 * - Demais métodos: delegam ao `PrismaClientsRepository` para o CRUD completo,
 *   consumido pelas rotas genéricas `/entities` do framework.
 */
export class LawFirmDomainEntityPort implements DomainEntityPort {
	/** Tag usada para agrupar as rotas /entities no Swagger/OpenAPI. */
	readonly entityTag = "clients";

	constructor(
		private readonly clientsRepository = new PrismaClientsRepository(),
	) {}

	// ── Chamado automaticamente pelo framework ao concluir a triagem ─────────

	async createFromScreening(
		input: CreateFromScreeningInput,
	): Promise<Either<Error, DomainEntityResult>> {
		const { lead } = input;

		// Idempotente — retorna o existente se a entidade já foi criada
		const existing = await this.clientsRepository.findByLeadId(lead.id);
		if (existing) {
			return right({ entityId: existing.id, entityType: "client", entity: existing });
		}

		// Cria Client com os dados disponíveis do Lead.
		// Campos complementares (CPF, endereço, etc.) são null por padrão —
		// o advogado os preenche via PUT /entities/:id no painel.
		const client = await this.clientsRepository.create({
			name: lead.name,
			email: lead.email ?? "",
			cellphone: lead.cellphone,
			workspaceId: lead.workspaceId,
			lawyerId: lead.lawyerId,
			createdFromLeadId: lead.id,
		});

		return right({ entityId: client.id, entityType: "client", entity: client });
	}

	// ── CRUD delegado pelas rotas genéricas /entities do framework ───────────

	async findById(id: string): Promise<DomainEntity | null> {
		return this.clientsRepository.findById(id);
	}

	async findByLeadId(leadId: string): Promise<DomainEntity | null> {
		return this.clientsRepository.findByLeadId(leadId);
	}

	async findMany(params: PaginationParams): Promise<PaginatedResult<DomainEntity>> {
		return this.clientsRepository.findMany(params);
	}

	async update(
		id: string,
		data: Record<string, unknown>,
	): Promise<Either<Error, DomainEntityResult>> {
		const client = await this.clientsRepository.findById(id);

		if (!client) {
			return left(new Error(`Client "${id}" not found.`));
		}

		// Aplica os campos reconhecidos pelo domínio jurídico, protegendo os imutáveis
		const updated = await this.clientsRepository.save({
			...client,
			...(data as Partial<typeof client>),
			id: client.id,
			createdFromLeadId: client.createdFromLeadId,
			workspaceId: client.workspaceId,
			createdAt: client.createdAt,
		});

		return right({ entityId: updated.id, entityType: "client", entity: updated });
	}

	async delete(id: string): Promise<void> {
		return this.clientsRepository.delete(id);
	}
}

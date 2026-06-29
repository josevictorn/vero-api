import type { Either } from "@/utils/either";
import type { AiSession, Lead } from "@generated/prisma/client";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";
import type { PaginationParams } from "@/utils/pagination-params";
import type { PaginatedResult } from "@/utils/paginated-results";

/**
 * Entidade de domínio genérica retornada pelo port.
 * Cada instância define os campos reais — o core só exige `id` e `leadId`.
 */
export type DomainEntity = {
	id: string;
	leadId?: string | null;
	[key: string]: unknown;
};

/**
 * Input fornecido pelo framework ao criar a entidade de domínio
 * a partir de uma triagem concluída.
 */
export interface CreateFromScreeningInput {
	/** Lead associado à sessão que concluiu a triagem. */
	lead: Lead;
	/** Sessão de IA após a transição para FORWARDED. */
	aiSession: AiSession;
	/** Dados coletados pelo agente entrevistador. */
	collectedData: CollectedDataItem[];
	/** Data atual formatada (vinda do contexto da transição). */
	today: string;
}

/**
 * Saída padronizada do port — o core só precisa do `entityId` e `entityType`.
 */
export interface DomainEntityResult {
	/** ID da entidade criada ou recuperada. */
	entityId: string;
	/** Tipo semântico da entidade (ex: "client", "patient", "contractor"). */
	entityType: string;
	/** A entidade completa para uso interno do port. */
	entity: DomainEntity;
}

/**
 * Port que define como a instância gerencia sua entidade primária de domínio.
 *
 * O framework:
 * - Chama `createFromScreening()` automaticamente ao concluir a triagem (FORWARDED)
 * - Fornece CRUD genérico via rotas `/entities` que delegam os demais métodos ao port
 *
 * A instância implementa este port — não precisa escrever use cases nem
 * controllers de CRUD para a entidade de domínio.
 *
 * @example
 * // Advocacia:   DomainEntity = Client   (CPF, RG, OAB, endereço...)
 * // Clínica:     DomainEntity = Patient  (plano de saúde, tipo sanguíneo...)
 * // Construtora: DomainEntity = Contractor (CNPJ, tipo de obra...)
 */
export interface DomainEntityPort {
	/**
	 * Tag usada para agrupar as rotas `/entities` na documentação da API.
	 * Definida pela instância para refletir o nome semântico da entidade.
	 * @example "clients" | "patients" | "contractors"
	 */
	readonly entityTag: string;

	/**
	 * Chamado automaticamente pelo framework quando a triagem é concluída.
	 * Deve ser idempotente: se a entidade já existir para o `leadId`, retorná-la.
	 */
	createFromScreening(
		input: CreateFromScreeningInput,
	): Promise<Either<Error, DomainEntityResult>>;

	/** Busca a entidade por ID. Retorna `null` se não encontrada. */
	findById(id: string): Promise<DomainEntity | null>;

	/** Busca a entidade associada a um Lead específico. */
	findByLeadId(leadId: string): Promise<DomainEntity | null>;

	/** Lista entidades com paginação padrão do framework. */
	findMany(params: PaginationParams): Promise<PaginatedResult<DomainEntity>>;

	/**
	 * Atualiza a entidade com os dados fornecidos.
	 * O body é livre — a instância valida e aplica os campos que reconhece.
	 */
	update(
		id: string,
		data: Record<string, unknown>,
	): Promise<Either<Error, DomainEntityResult>>;

	/** Remove a entidade por ID. */
	delete(id: string): Promise<void>;
}

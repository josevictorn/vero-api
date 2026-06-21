import type { AiSession } from "@generated/prisma/client";
import type { Either } from "@/utils/either";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";

export interface StatusHandlerContext {
	workspaceName: string;
}

/**
 * Tipo do handler de um status de sessão.
 * A instância fornece um handler por status que ela suporta.
 */
export type StatusHandler = (
	session: AiSession,
	message: string,
	ctx: StatusHandlerContext,
) => Promise<Either<Error, { reply: string }>>;

/**
 * Mapa de status → handler.
 * Injetado no RouteMessageUseCase pela instância.
 * Permite que cada projeto defina seus próprios status e comportamentos.
 */
export type StatusHandlerMap = Record<string, StatusHandler>;

/**
 * Contexto fornecido ao hook `onStatusTransition` imediatamente após
 * uma mudança de status de sessão ser persistida pelo core.
 */
export interface StatusTransitionContext {
	/** Status anterior à transição. */
	previousStatus: string;
	/** Novo status atribuído à sessão. */
	newStatus: string;
	/** Sessão de IA após a atualização de status. */
	aiSession: AiSession;
	/** Dados coletados pelo agente entrevistador (disponível na transição para FORWARDED). */
	collectedData?: CollectedDataItem[];
	/** Nome do contato identificado (disponível nas transições após IDENTIFYING). */
	contactName?: string;
	/** Data atual formatada (disponível na transição para FORWARDED). */
	today?: string;
}

/**
 * Handler chamado após uma transição de status.
 * Recebe o contexto completo da transição para executar lógicas de domínio.
 */
export type StatusTransitionHandler = (ctx: StatusTransitionContext) => Promise<void>;

/**
 * Mapa de novo-status → handler de transição.
 * Registrado no InstanceConfig pela instância para reagir a mudanças de estado.
 *
 * @example
 * onStatusTransition: {
 *   FORWARDED: async (ctx) => analyzerUseCase.execute(ctx),
 *   INTERVIEWING: async (ctx) => notificationService.notify(ctx),
 * }
 */
export type StatusTransitionMap = Record<string, StatusTransitionHandler>;

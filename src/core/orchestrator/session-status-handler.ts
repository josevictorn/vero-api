import type { AiSession } from "@generated/prisma/client";
import type { Either } from "@/utils/either";

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

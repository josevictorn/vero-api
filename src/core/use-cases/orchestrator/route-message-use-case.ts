import { right, left, Either } from "@/utils/either";
import { AiSession } from "@generated/prisma/client";
import { UnknownStatusError } from "./errors/unknown-status-error";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { StatusHandlerMap } from "@core/orchestrator/session-status-handler";

interface RouteMessageRequest {
    aiSession: AiSession,
    messageText: string,
}

type RouteMessageResponse = Either<
    UnknownStatusError | AgentResponseError,
    { messageToClient: string }
>

/**
 * Roteia uma mensagem recebida para o handler correto baseado no status da sessão.
 *
 * O mapa de handlers é fornecido integralmente pela instância via `InstanceConfig.statusHandlers`.
 * O core não conhece nenhum status específico — apenas delega.
 */
export class RouteMessageUseCase {
    constructor(
        private readonly statusHandlers: StatusHandlerMap,
    ) {}

    async execute({ aiSession, messageText }: RouteMessageRequest): Promise<RouteMessageResponse> {
        const handler = this.statusHandlers[aiSession.status];

        if (!handler) {
            return left(new UnknownStatusError());
        }

        const result = await handler(aiSession, messageText, {
            workspaceName: aiSession.name,
        });

        if (result.isLeft()) {
            return left(result.value);
        }

        return right({
            messageToClient: result.value?.reply ?? "",
        });
    }
}
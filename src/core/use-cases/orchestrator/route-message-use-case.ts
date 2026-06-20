import { right, left, Either } from "@/utils/either";
import { AiSessionStatus } from "@generated/prisma/enums";
import { AiSession } from "@generated/prisma/client";
import { UnknownStatusError } from "./errors/unknown-status-error";
import { WorkspaceNotConfiguredError } from "./agents/errors/workspace-not-configured-error";
import { ScreeningFlowNotMatchedError } from "./agents/errors/screening-flow-not-matched-error";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import { ProcessInterviewInterviewerAgentUseCase } from "./agents/process-interview-interviewer-agent";
import { ProcessMessageIdentifyingAgentUseCase } from "./agents/process-message-identifying-agent";

interface RouteMessageRequest {
    aiSession: AiSession,
    messageText: string,
    today?: Date
}

type RouteMessageResponse = Either<
    WorkspaceNotConfiguredError |
    ScreeningFlowNotMatchedError |
    AgentResponseError,
    { messageToClient: string }
>

export class RouteMessageUseCase {
    constructor(
        private readonly identifyingUseCase: ProcessMessageIdentifyingAgentUseCase,
        private readonly interviewingUseCase: ProcessInterviewInterviewerAgentUseCase
    ) {}

    async execute({ aiSession, messageText }: RouteMessageRequest): Promise<RouteMessageResponse> {
        
        const strategies: Record<string, () => Promise<RouteMessageResponse>> = {
            [AiSessionStatus.IDENTIFYING]: () => this.identifyingUseCase.execute({ 
                aiSession, 
                messageText 
            }),
            [AiSessionStatus.INTERVIEWING]: () => {
                const today = new Date().toLocaleDateString("pt-BR", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                });
                return this.interviewingUseCase.execute({ 
                    aiSession, 
                    messageText, 
                    today 
                });
            },
            [AiSessionStatus.FORWARDED]: async () => right({ messageToClient: "" }),
            [AiSessionStatus.BOOKING]: async () => right({ messageToClient: "" }),
            [AiSessionStatus.BOOKED]: async () => right({ messageToClient: "" }),
        };

        const processMessageStrategy = strategies[aiSession.status];

        if (!processMessageStrategy) {
            return left(new UnknownStatusError);
        }

        const result = await processMessageStrategy();

        if (result.isLeft()) {
            return left(result.value);
        }

        return right({
            messageToClient: result.value?.messageToClient
        });
    }
}
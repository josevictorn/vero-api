import { Either, left, right } from "@/utils/either"
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error"
import { AiSession } from "@generated/prisma/client"
import { CreateAiSessionUseCase } from "../ai-session/create-ai-session"
import { EditAiSessionUseCase } from "../ai-session/edit-ai-session"
import { GetAiSessionByChatIdUseCase } from "../ai-session/get-ai-session-by-chat-id"
import { CreateLeadUseCase } from "../leads/create-lead"
import { FetchWorkspacesUseCase } from "../workspaces/fetch-workspaces"
import { ScreeningFlowNotFoundError } from "../ai-session/errors/screening-flow-not-found-error";
import { ScreeningFlowNotMatchedError } from "./agents/errors/screening-flow-not-matched-error";
import { WorkspaceNotConfiguredError } from "./agents/errors/workspace-not-configured-error";

interface HandleIncomingMessageRequest {
    phoneNumber: string,
    contactName: string,
    chatId: string
}

type HandleIncomingMessageResponse = Either<
    ScreeningFlowNotFoundError |
    WorkspaceNotFoundError |
    WorkspaceNotConfiguredError |
    ScreeningFlowNotMatchedError,
    { aiSession: AiSession }
>

export class HandleIncomingMessageUseCase {
    constructor(
        private readonly getAiSession: GetAiSessionByChatIdUseCase,
        private readonly createAiSession: CreateAiSessionUseCase,
        private readonly createLead: CreateLeadUseCase,
        private readonly fetchWorkspaces: FetchWorkspacesUseCase,
        private readonly editAiSession: EditAiSessionUseCase,
        /** Status que indicam sessão encerrada — vêm do InstanceConfig.terminalStatuses */
        private readonly terminalStatuses: string[],
    ) {}

    async execute({
        phoneNumber,
        contactName,
        chatId
    }: HandleIncomingMessageRequest): Promise<HandleIncomingMessageResponse> {

        const getSessionResult = await this.getAiSession.execute({ aiSessionChatId: chatId });

        const isTerminalSession =
            getSessionResult.isRight() &&
            this.terminalStatuses.includes(getSessionResult.value.aiSession.status);

        if (getSessionResult.isLeft() || isTerminalSession) {

            const createResult = await this.createAiSession.execute({
                cellphone: phoneNumber,
                chatId: chatId,
                name: contactName,
                chatState: {}
            });

            if (createResult.isLeft()) {
                return left(createResult.value)
            }

            const activeSession = createResult.value.aiSession;

            const workspace = await this.fetchWorkspaces.execute({ page: 1 });

            if (workspace.isLeft()) {
                return left(workspace.value)
            }

            const createLeadResult = await this.createLead.execute({
                workspaceId: workspace.value.results[0].id,
                name: contactName,
                cellphone: phoneNumber,
            })

            if (createLeadResult.isLeft()) {
                return left(createLeadResult.value)
            }

            activeSession.leadId = createLeadResult.value.lead.id;

            await this.editAiSession.execute({
                ...activeSession,
                aiSessionId: activeSession.id,
                chatState: activeSession.chatState ?? {}
            })

            return right({ aiSession: activeSession })
        }

        return right({ aiSession: getSessionResult.value.aiSession })
    }
}
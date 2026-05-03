import { makeCreateAiSessionUseCase } from "@/use-cases/ai-session/factories/make-create-ai-session-use-case";
import { makeEditAiSessionUseCase } from "@/use-cases/ai-session/factories/make-edit-ai-session-use-case";
import { makeGetAiSessionByChatIdUseCase } from "@/use-cases/ai-session/factories/make-get-ai-session-by-chat-id-use-case";
import { makeCreateLeadUseCase } from "@/use-cases/leads/factories/make-create-lead-use-case";
import { makeFetchWorkspacesUseCase } from "@/use-cases/workspaces/factories/make-fetch-workspaces-use-case";
import { HandleIncomingMessageUseCase } from "../handle-incoming-message";


export function makeHandleIncomingMessageUseCase() {
    return new HandleIncomingMessageUseCase(
        makeGetAiSessionByChatIdUseCase(),
        makeCreateAiSessionUseCase(),
        makeCreateLeadUseCase(),
        makeFetchWorkspacesUseCase(),
        makeEditAiSessionUseCase()
    )
}
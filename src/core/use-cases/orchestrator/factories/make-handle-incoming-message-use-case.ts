import { makeCreateAiSessionUseCase } from "../../ai-session/factories/make-create-ai-session-use-case";
import { makeEditAiSessionUseCase } from "../../ai-session/factories/make-edit-ai-session-use-case";
import { makeGetAiSessionByChatIdUseCase } from "../../ai-session/factories/make-get-ai-session-by-chat-id-use-case";
import { makeCreateLeadUseCase } from "../../leads/factories/make-create-lead-use-case";
import { makeFetchWorkspacesUseCase } from "../../workspaces/factories/make-fetch-workspaces-use-case";
import { HandleIncomingMessageUseCase } from "../handle-incoming-message";
import type { InstanceConfig } from "@/core/config/instance-config.port";


export function makeHandleIncomingMessageUseCase(config: InstanceConfig) {
    return new HandleIncomingMessageUseCase(
        makeGetAiSessionByChatIdUseCase(),
        makeCreateAiSessionUseCase(),
        makeCreateLeadUseCase(),
        makeFetchWorkspacesUseCase(),
        makeEditAiSessionUseCase(),
        config.terminalStatuses,
    )
}
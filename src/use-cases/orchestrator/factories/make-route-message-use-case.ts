import { makeProcessMessageIdentifyingAgentUseCase } from "@/use-cases/agents/factories/make-process-message-identifying-agent";
import { RouteMessageUseCase } from "../route-message-use-case";
import { makeProcessInterviewInterviewerAgentUseCase } from "@/use-cases/agents/factories/make-process-interview-interviewer-agent";


export function makeRouteMessageUseCase() {
    return new RouteMessageUseCase(
        makeProcessMessageIdentifyingAgentUseCase(),
        makeProcessInterviewInterviewerAgentUseCase()
    )
}
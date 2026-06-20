import { RouteMessageUseCase } from "../route-message-use-case";
import { makeProcessInterviewInterviewerAgentUseCase } from "../agents/factories/make-process-interview-interviewer-agent";
import { makeProcessMessageIdentifyingAgentUseCase } from "../agents/factories/make-process-message-identifying-agent";


export function makeRouteMessageUseCase() {
    return new RouteMessageUseCase(
        makeProcessMessageIdentifyingAgentUseCase(),
        makeProcessInterviewInterviewerAgentUseCase()
    )
}
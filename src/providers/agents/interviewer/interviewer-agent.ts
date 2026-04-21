import type { ChatMessage } from "../types/chat-message";
import type { CollectedDataItem } from "../types/collected-data-item";
import type { Either } from "@/utils/either";
import type { AgentResponseError } from "../errors/agent-response-error";

export interface InterviewerAgentInput {
	message: string;
	isThirdParty: boolean;
	clientName: string;
	caseCategory: string;
	questions: string[];
	collectedData: CollectedDataItem[];
	today: string;
	chatHistory?: ChatMessage[];
}

export interface InterviewerAgentOutput {
	clientName: string;
	nextQuestionToClient: string;
	collectedData: CollectedDataItem[];
	screeningCompleted: boolean;
}

export interface InterviewerAgent {
	interview(
		input: InterviewerAgentInput,
	): Promise<Either<AgentResponseError, InterviewerAgentOutput>>;
}

import type { ChatMessage } from "@core/agents/types/chat-message";
import type { CollectedDataItem } from "@core/agents/types/collected-data-item";
import type { Either } from "@/utils/either";
import type { AgentResponseError } from "@core/agents/errors/agent-response-error";

export interface InterviewerAgentInput {
	message: string;
	isThirdParty: boolean;
	contactName: string;
	caseCategory: string;
	questions: Record<string, string>;
	collectedData: CollectedDataItem[];
	today: string;
	chatHistory?: ChatMessage[];
}

export interface InterviewerAgentOutput {
	contactName: string;
	nextQuestionToClient: string;
	collectedData: CollectedDataItem[];
	screeningCompleted: boolean;
}

export interface InterviewerAgent {
	interview(
		input: InterviewerAgentInput,
	): Promise<Either<AgentResponseError, InterviewerAgentOutput>>;
}

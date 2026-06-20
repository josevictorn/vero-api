import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import { ChatMessage } from "@/providers/agents/types/chat-message";
import { CollectedDataItem } from "@/providers/agents/types/collected-data-item";
import type { Either } from "@/utils/either";

export interface InterviewerAgentInput {
	message: string;
	isThirdParty: boolean;
	clientName: string;
	caseCategory: string;
	questions: Record<string, string>;
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

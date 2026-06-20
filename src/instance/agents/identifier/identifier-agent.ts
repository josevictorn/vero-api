import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import { ChatMessage } from "@/providers/agents/types/chat-message";
import type { Either } from "@/utils/either";

export interface IdentifierAgentInput {
	message: string;
	officeName: string;
	caseTypes: string[];
	chatHistory?: ChatMessage[];
}

export interface IdentifierAgentOutput {
	messageToClient: string;
	identifiedCategory: string;
	isThirdParty: boolean;
	fullName: string;
}

export interface IdentifierAgent {
	identify(
		input: IdentifierAgentInput,
	): Promise<Either<AgentResponseError, IdentifierAgentOutput>>;
}

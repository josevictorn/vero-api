import type { ChatMessage } from "../types/chat-message";
import type { Either } from "@/utils/either";
import type { AgentResponseError } from "../errors/agent-response-error";

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

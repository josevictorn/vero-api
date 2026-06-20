import type { ChatMessage } from "@core/agents/types/chat-message";
import type { Either } from "@/utils/either";
import type { AgentResponseError } from "@core/agents/errors/agent-response-error";

export interface IdentifierAgentInput {
	message: string;
	/** Nome do negócio/workspace (ex: nome do escritório, clínica, etc.) */
	workspaceName: string;
	caseTypes: string[];
	chatHistory?: ChatMessage[];
}

export interface IdentifierAgentOutput {
	messageToClient: string;
	identifiedCategory: string;
	isThirdParty: boolean;
	contactName: string;
}

export interface IdentifierAgent {
	identify(
		input: IdentifierAgentInput,
	): Promise<Either<AgentResponseError, IdentifierAgentOutput>>;
}

import { Type } from "@google/genai";
import { z } from "zod";
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import type {
	IdentifierAgent,
	IdentifierAgentInput,
	IdentifierAgentOutput,
} from "./identifier-agent";
import { buildIdentifierSystemPrompt } from "./identifier-prompt";
import { ChatMessage } from "@/providers/agents/types/chat-message";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";

const AGENT_NAME = "identifier";
const MODEL = "gemini-3-flash-preview";

const identifierResponseSchema = z.object({
	messageToClient: z.string(),
	identifiedCategory: z.string(),
	isThirdParty: z.boolean(),
	fullName: z.string(),
});

const identifierJsonSchema = {
	type: Type.OBJECT,
	properties: {
		messageToClient: {
			type: Type.STRING,
			description: "A resposta humanizada para enviar no WhatsApp.",
		},
		identifiedCategory: {
			type: Type.STRING,
			description:
				"A categoria identificada ou 'nao_identificado' se ainda não souber.",
		},
		isThirdParty: {
			type: Type.BOOLEAN,
			description:
				"True se o contato é em nome de outra pessoa, False se for para si mesmo.",
		},
		fullName: {
			type: Type.STRING,
			description:
				"O nome completo da pessoa ou 'nao_identificado' se ainda não souber.",
		},
	},
	required: ["messageToClient", "identifiedCategory", "isThirdParty", "fullName"],
};

function buildContents(chatHistory: ChatMessage[], message: string) {
	const contents = chatHistory.map((m) => ({
		role: m.role,
		parts: [{ text: m.content }],
	}));

	contents.push({ role: "user", parts: [{ text: message }] });

	return contents;
}

export class GeminiIdentifierAgent implements IdentifierAgent {
	async identify(
		input: IdentifierAgentInput,
	): Promise<Either<AgentResponseError, IdentifierAgentOutput>> {
		const systemInstruction = buildIdentifierSystemPrompt({
			officeName: input.officeName,
			caseTypes: input.caseTypes,
		});

		const contents = buildContents(input.chatHistory ?? [], input.message);

		const response = await aiClient.models.generateContent({
			model: MODEL,
			contents,
			config: {
				systemInstruction,
				responseMimeType: "application/json",
				responseJsonSchema: identifierJsonSchema,
			},
		});

		const parsed = JSON.parse(response.text ?? "{}");
		const result = identifierResponseSchema.safeParse(parsed);

		if (!result.success) {
			return left(new AgentResponseError(AGENT_NAME, result.error.message));
		}

		return right(result.data);
	}
}

import { Type } from "@google/genai";
import { z } from "zod";
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import { AgentResponseError } from "../errors/agent-response-error";
import type { ChatMessage } from "../types/chat-message";
import type {
	InterviewerAgent,
	InterviewerAgentInput,
	InterviewerAgentOutput,
} from "./interviewer-agent";
import { buildInterviewerSystemPrompt } from "./interviewer-prompt";

const AGENT_NAME = "Entrevistador";
const MODEL = "gemini-3-flash-preview";

const interviewerResponseSchema = z.object({
	clientName: z.string(),
	nextQuestionToClient: z.string(),
	collectedData: z.array(
		z.object({
			field: z.string(),
			answer: z.string(),
		}),
	),
	screeningCompleted: z.boolean(),
});

const interviewerJsonSchema = {
	type: Type.OBJECT,
	properties: {
		clientName: {
			type: Type.STRING,
			description:
				"Nome de quem precisa do benefício (e quem está falando, se for o caso).",
		},
		nextQuestionToClient: {
			type: Type.STRING,
			description:
				"A próxima pergunta curta e direta, ou mensagem de encerramento se a triagem acabou.",
		},
		collectedData: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					field: {
						type: Type.STRING,
						description: "Chave exata do roteiro de perguntas.",
					},
					answer: {
						type: Type.STRING,
						description:
							"Resposta extraída, deduzida, ou 'ainda_nao_perguntado'.",
					},
				},
				required: ["field", "answer"],
			},
			description: "Lista de dados coletados até o momento.",
		},
		screeningCompleted: {
			type: Type.BOOLEAN,
			description:
				"True se todos os dados foram coletados, False caso contrário.",
		},
	},
	required: [
		"clientName",
		"nextQuestionToClient",
		"collectedData",
		"screeningCompleted",
	],
};

function buildContents(chatHistory: ChatMessage[], message: string) {
	const contents = chatHistory.map((m) => ({
		role: m.role,
		parts: [{ text: m.content }],
	}));

	contents.push({ role: "user", parts: [{ text: message }] });

	return contents;
}

export class GeminiInterviewerAgent implements InterviewerAgent {
	async interview(
		input: InterviewerAgentInput,
	): Promise<Either<AgentResponseError, InterviewerAgentOutput>> {
		const systemInstruction = buildInterviewerSystemPrompt({
			isThirdParty: input.isThirdParty,
			clientName: input.clientName,
			caseCategory: input.caseCategory,
			questions: input.questions,
			collectedData: input.collectedData,
			today: input.today,
		});

		const contents = buildContents(input.chatHistory ?? [], input.message);

		const response = await aiClient.models.generateContent({
			model: MODEL,
			contents,
			config: {
				systemInstruction,
				responseMimeType: "application/json",
				responseJsonSchema: interviewerJsonSchema,
			},
		});

		const parsed = JSON.parse(response.text ?? "{}");
		const result = interviewerResponseSchema.safeParse(parsed);

		if (!result.success) {
			return left(new AgentResponseError(AGENT_NAME, result.error.message));
		}

		return right(result.data);
	}
}

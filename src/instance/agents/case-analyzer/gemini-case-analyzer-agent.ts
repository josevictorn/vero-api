import { Type } from "@google/genai";
import { z } from "zod";
import { aiClient } from "@/lib/ai";
import { left, right, type Either } from "@/utils/either";
import type {
	CaseAnalyzerAgent,
	CaseAnalyzerAgentInput,
	CaseAnalyzerAgentOutput,
} from "./case-analyzer-agent";
import { buildCaseAnalyzerSystemPrompt } from "./case-analyzer-prompt";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";

const AGENT_NAME = "caseAnalyzer";
const MODEL = "gemini-3.1-flash-lite";

const caseAnalyzerResponseSchema = z.object({
	title: z.string(),
	viabilityLabel: z.enum(["Alta", "Moderada", "Baixa"]),
	analysisText: z.string(),
	estimatedComplexity: z.enum(["Simples", "Média", "Alta"]),
	mainLegalBase: z.string(),
});

const caseAnalyzerJsonSchema = {
	type: Type.OBJECT,
	properties: {
		title: {
			type: Type.STRING,
			description: "Um título curto de 5 a 7 palavras resumindo a tese.",
		},
		viabilityLabel: {
			type: Type.STRING,
			description: "Alta, Moderada ou Baixa.",
			enum: ["Alta", "Moderada", "Baixa"],
		},
		analysisText: {
			type: Type.STRING,
			description:
				"Explicação técnica de 3 parágrafos para o advogado ler.",
		},
		estimatedComplexity: {
			type: Type.STRING,
			description: "Simples, Média ou Alta.",
			enum: ["Simples", "Média", "Alta"],
		},
		mainLegalBase: {
			type: Type.STRING,
			description: "Citação da principal lei ou súmula aplicável.",
		},
	},
	required: [
		"title",
		"viabilityLabel",
		"analysisText",
		"estimatedComplexity",
		"mainLegalBase",
	],
};

export class GeminiCaseAnalyzerAgent implements CaseAnalyzerAgent {
	async analyze(
		input: CaseAnalyzerAgentInput,
	): Promise<Either<AgentResponseError, CaseAnalyzerAgentOutput>> {
		const systemInstruction = buildCaseAnalyzerSystemPrompt({
			today: input.today,
		});

		const userPrompt = JSON.stringify({
			clientName: input.clientName,
			collectedData: input.collectedData,
		});

		const response = await aiClient.models.generateContent({
			model: MODEL,
			contents: userPrompt,
			config: {
				systemInstruction,
				responseMimeType: "application/json",
				responseJsonSchema: caseAnalyzerJsonSchema,
			},
		});

		const parsed = JSON.parse(response.text ?? "{}");
		const result = caseAnalyzerResponseSchema.safeParse(parsed);

		if (!result.success) {
			return left(new AgentResponseError(AGENT_NAME, result.error.message));
		}

		return right(result.data);
	}
}

import { type Either, left, right } from "@/utils/either";
import type { AiSession } from "@generated/prisma/client";
import { GeminiCaseAnalyzerAgent } from "@/instance/agents/case-analyzer/gemini-case-analyzer-agent";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";
import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { ScreeningCompletedContext } from "@/core/config/instance-config.port";

/**
 * Executa a análise jurídica do caso após a triagem ser concluída
 * e persiste o resultado como um `ScreeningReport` genérico com `data` jurídico.
 *
 * Usado como implementação do hook `onScreeningCompleted` no InstanceConfig jurídico.
 */
export class ProcessScreeningAnalyzerAgentUseCase {
	private readonly caseAnalyzerAgent = new GeminiCaseAnalyzerAgent();
	private readonly screeningReportRepository = new PrismaScreeningReportRepository();

	async execute(ctx: ScreeningCompletedContext): Promise<void> {
		const { aiSession, leadId, contactName, collectedData, today } = ctx;

		const agentResult = await this.caseAnalyzerAgent.analyze({
			clientName: contactName,
			collectedData,
			today,
		});

		if (agentResult.isLeft()) {
			// Erros de análise são não-fatais — o fluxo de triagem já foi concluído.
			console.error("[ProcessScreeningAnalyzerAgent] Falha na análise:", agentResult.value);
			return;
		}

		const { title, viabilityLabel, analysisText, estimatedComplexity, mainLegalBase } =
			agentResult.value;

		await this.screeningReportRepository.create({
			aiSessionId: aiSession.id,
			leadId,
			title,
			summary: `Viabilidade: ${viabilityLabel} | Complexidade: ${estimatedComplexity}`,
			data: {
				viabilityLabel,
				analysisText,
				estimatedComplexity,
				mainLegalBase,
			},
		});
	}
}

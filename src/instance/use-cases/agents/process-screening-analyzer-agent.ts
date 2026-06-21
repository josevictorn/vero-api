import { type Either, left, right } from "@/utils/either";
import type { AiSession } from "@generated/prisma/client";
import { GeminiCaseAnalyzerAgent } from "@/instance/agents/case-analyzer/gemini-case-analyzer-agent";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";
import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { StatusTransitionContext } from "@/core/orchestrator/session-status-handler";

/**
 * Executa a análise jurídica do caso após a triagem ser concluída
 * e persiste o resultado como um `ScreeningReport` genérico com `data` jurídico.
 *
 * Registrado como handler de `onStatusTransition["FORWARDED"]` no InstanceConfig jurídico.
 * Nessa transição específica, `contactName`, `collectedData` e `today` estão sempre presentes.
 */
export class ProcessScreeningAnalyzerAgentUseCase {
	private readonly caseAnalyzerAgent = new GeminiCaseAnalyzerAgent();
	private readonly screeningReportRepository = new PrismaScreeningReportRepository();

	async execute(ctx: StatusTransitionContext): Promise<void> {
		const { aiSession, contactName, collectedData, today } = ctx;
		const leadId = aiSession.leadId;

		// Campos opcionais no tipo genérico, mas garantidos nessa transição específica
		if (!contactName || !collectedData || !today || !leadId) {
			console.warn("[ProcessScreeningAnalyzerAgent] Contexto incompleto — análise ignorada.", {
				contactName,
				collectedData,
				today,
				leadId,
			});
			return;
		}

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

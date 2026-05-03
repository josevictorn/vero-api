import type { CaseAnalyzerAgent } from "@/providers/agents/case-analyzer/case-analyzer-agent";
import type { CollectedDataItem } from "@/providers/agents/types/collected-data-item";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import type { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { type Either, left, right } from "@/utils/either";
import type { AiSession, CaseAnalysis } from "@generated/prisma/client";

interface ProcessMessageCaseAnalyzerAgentRequest {
	aiSession: AiSession;
	leadId: string;
	clientName: string;
	collectedData: CollectedDataItem[];
	today: string;
}

type ProcessMessageCaseAnalyzerAgentResponse = Either<
	AgentResponseError,
	{ caseAnalysis: CaseAnalysis }
>;

export class ProcessMessageCaseAnalyzerAgentUseCase {
	constructor(
		private readonly caseAnalysisRepository: CaseAnalysisRepository,
		private readonly caseAnalyzerAgent: CaseAnalyzerAgent,
	) {}

	async execute({
		aiSession,
		leadId,
		clientName,
		collectedData,
		today,
	}: ProcessMessageCaseAnalyzerAgentRequest): Promise<ProcessMessageCaseAnalyzerAgentResponse> {
		const agentResult = await this.caseAnalyzerAgent.analyze({
			clientName,
			collectedData,
			today,
		});

		if (agentResult.isLeft()) {
			return left(agentResult.value);
		}

		const { title, viabilityLabel, analysisText, estimatedComplexity, mainLegalBase } =
			agentResult.value;

		const caseAnalysis = await this.caseAnalysisRepository.create({
			aiSessionId: aiSession.id,
			leadId,
			title,
			viabilityLabel,
			analysisText,
			estimatedComplexity,
			mainLegalBase,
		});

		return right({ caseAnalysis });
	}
}
import type { CollectedDataItem } from "../types/collected-data-item";
import type { Either } from "@/utils/either";
import type { AgentResponseError } from "../errors/agent-response-error";

export interface CaseAnalyzerAgentInput {
	clientName: string;
	collectedData: CollectedDataItem[];
	today: string;
}

export interface CaseAnalyzerAgentOutput {
	title: string;
	viabilityLabel: string;
	analysisText: string;
	estimatedComplexity: string;
	mainLegalBase: string;
}

export interface CaseAnalyzerAgent {
	analyze(
		input: CaseAnalyzerAgentInput,
	): Promise<Either<AgentResponseError, CaseAnalyzerAgentOutput>>;
}

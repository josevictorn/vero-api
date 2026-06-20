import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { GeminiInterviewerAgent } from "@instance/agents/interviewer/gemini-interviewer-agent";
import { GeminiCaseAnalyzerAgent } from "@instance/agents/case-analyzer/gemini-case-analyzer-agent";
import { RedisChatMemoryProvider } from "@/providers/agents/memory/redis-chat-memory-provider";
import { ProcessMessageCaseAnalyzerAgentUseCase } from "@instance/use-cases/agents/process-case-case-analyzer-agent";
import { ProcessInterviewInterviewerAgentUseCase } from "../process-interview-interviewer-agent";

export function makeProcessInterviewInterviewerAgentUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const aiSessionRepository = new PrismaAiSessionRepository();
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();

	const interviewerAgent = new GeminiInterviewerAgent();
	const caseAnalyzerAgent = new GeminiCaseAnalyzerAgent();
	const chatMemoryProvider = new RedisChatMemoryProvider();

	const caseAnalyzerUseCase = new ProcessMessageCaseAnalyzerAgentUseCase(
		caseAnalysisRepository,
		caseAnalyzerAgent,
	);

	return new ProcessInterviewInterviewerAgentUseCase(
		screeningFlowsRepository,
		aiSessionRepository,
		interviewerAgent,
		chatMemoryProvider,
		caseAnalyzerUseCase,
	);
}

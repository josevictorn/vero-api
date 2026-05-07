import type { AiSession, ScreeningFlow } from "@generated/prisma/client";
import { AiSessionStatus } from "@generated/prisma/client";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import type { InterviewerAgent } from "@/providers/agents/interviewer/interviewer-agent";
import type { ChatMemoryProvider } from "@/providers/agents/memory/chat-memory-provider";
import type { CollectedDataItem } from "@/providers/agents/types/collected-data-item";
import type { ChatMessage } from "@/providers/agents/types/chat-message";
import { type Either, left, right } from "@/utils/either";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import type { ProcessMessageCaseAnalyzerAgentUseCase } from "./process-case-case-analyzer-agent";

interface ProcessInterviewInterviewerAgentRequest {
	aiSession: AiSession;
	messageText: string;
	today: string;
}

type ProcessInterviewInterviewerAgentResponse = Either<
	AgentResponseError | ScreeningFlowNotFoundError,
	{ messageToClient: string; screeningCompleted: boolean }
>;

function buildChatMemoryKey(chatId: string): string {
	return `${chatId}-entrevista`;
}

function parseCollectedData(chatState: AiSession["chatState"]): CollectedDataItem[] {
	if (!chatState || !Array.isArray(chatState)) {
		return [];
	}
	return chatState as CollectedDataItem[];
}

function parseQuestions(questions: ScreeningFlow["questions"]): Record<string, string> {
	if (!questions || typeof questions !== "object" || Array.isArray(questions)) {
		return {};
	}
	return questions as Record<string, string>;
}

export class ProcessInterviewInterviewerAgentUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository,
		private readonly aiSessionRepository: AiSessionRepository,
		private readonly interviewerAgent: InterviewerAgent,
		private readonly chatMemoryProvider: ChatMemoryProvider,
		private readonly caseAnalyzerUseCase: ProcessMessageCaseAnalyzerAgentUseCase,
	) {}

	async execute({
		aiSession,
		messageText,
		today,
	}: ProcessInterviewInterviewerAgentRequest): Promise<ProcessInterviewInterviewerAgentResponse> {
		if (!aiSession.screeningFlowId) {
			return left(new ScreeningFlowNotFoundError());
		}

		const screeningFlow = await this.screeningFlowsRepository.findById(
			aiSession.screeningFlowId,
		);

		if (!screeningFlow) {
			return left(new ScreeningFlowNotFoundError());
		}

		const questions = parseQuestions(screeningFlow.questions);
		const collectedData = parseCollectedData(aiSession.chatState);

		const memoryKey = buildChatMemoryKey(aiSession.chatId);
		const chatHistory = await this.chatMemoryProvider.getHistory(memoryKey);

		const agentResult = await this.interviewerAgent.interview({
			message: messageText,
			isThirdParty: aiSession.isThirdParty,
			clientName: aiSession.name,
			caseCategory: screeningFlow.caseType,
			questions,
			collectedData,
			today,
			chatHistory,
		});

		if (agentResult.isLeft()) {
			return left(agentResult.value);
		}

		const agentOutput = agentResult.value;

		const updatedHistory: ChatMessage[] = [
			...chatHistory,
			{ role: "user", content: messageText },
			{ role: "model", content: agentOutput.nextQuestionToClient },
		];
		await this.chatMemoryProvider.saveHistory(memoryKey, updatedHistory);

		aiSession.chatState = agentOutput.collectedData as unknown as AiSession["chatState"];
		await this.aiSessionRepository.save(aiSession);

		if (!agentOutput.screeningCompleted) {
			return right({
				messageToClient: agentOutput.nextQuestionToClient,
				screeningCompleted: false,
			});
		}

		if (aiSession.leadId) {
			await this.caseAnalyzerUseCase.execute({
				aiSession,
				leadId: aiSession.leadId,
				clientName: agentOutput.clientName,
				collectedData: agentOutput.collectedData,
				today,
			});
		}

		aiSession.status = AiSessionStatus.FORWARDED;
		await this.aiSessionRepository.save(aiSession);

		return right({
			messageToClient: agentOutput.nextQuestionToClient,
			screeningCompleted: true,
		});
	}
}
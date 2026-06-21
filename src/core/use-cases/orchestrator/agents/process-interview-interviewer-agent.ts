import type { AiSession, ScreeningFlow } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import type { InterviewerAgent } from "@/core/agents/ports/interviewer-agent.port";
import type { ChatMemoryPort } from "@/core/agents/ports/chat-memory.port";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { ChatMessage } from "@/core/agents/types/chat-message";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";
import type { ScreeningCompletedContext } from "@/core/config/instance-config.port";

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
	return chatState as unknown as CollectedDataItem[];
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
		private readonly chatMemoryProvider: ChatMemoryPort,
		/** Hook opcional da instância para executar lógica pós-triagem (ex: análise jurídica). */
		private readonly onScreeningCompleted?: (ctx: ScreeningCompletedContext) => Promise<void>,
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
			contactName: aiSession.name,
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

		// Triagem concluída: invocar o hook da instância (se fornecido)
		if (aiSession.leadId && this.onScreeningCompleted) {
			const ctx: ScreeningCompletedContext = {
				aiSession,
				leadId: aiSession.leadId,
				contactName: agentOutput.contactName,
				collectedData: agentOutput.collectedData,
				today,
			};
			await this.onScreeningCompleted(ctx);
		}

		aiSession.status = "FORWARDED";
		await this.aiSessionRepository.save(aiSession);

		return right({
			messageToClient: agentOutput.nextQuestionToClient,
			screeningCompleted: true,
		});
	}
}
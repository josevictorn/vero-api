import type { AiSession, ScreeningFlow } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { LeadsRepository } from "@/core/repositories/leads-repository";
import type { InterviewerAgent } from "@/core/agents/ports/interviewer-agent.port";
import type { ChatMemoryPort } from "@/core/agents/ports/chat-memory.port";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { ChatMessage } from "@/core/agents/types/chat-message";
import type { CollectedDataItem } from "@/core/agents/types/collected-data-item";
import type { StatusTransitionMap } from "@/core/orchestrator/session-status-handler";
import type { DomainEntityPort } from "@/core/ports/domain-entity.port";

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
		private readonly leadsRepository: LeadsRepository,
		private readonly interviewerAgent: InterviewerAgent,
		private readonly chatMemoryProvider: ChatMemoryPort,
		/** Mapa de hooks de transição de status fornecido pela instância. */
		private readonly onStatusTransition?: StatusTransitionMap,
		/** Port da entidade de domínio — se configurado, cria a entidade ao concluir a triagem. */
		private readonly domainEntityPort?: DomainEntityPort,
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

		// ── Triagem concluída → transição para FORWARDED ──────────────────────────
		const previousStatus = aiSession.status;
		aiSession.status = "FORWARDED";
		await this.aiSessionRepository.save(aiSession);

		// 1) Criar a entidade de domínio via port (não-fatal se falhar)
		let domainEntityId: string | undefined;

		if (this.domainEntityPort && aiSession.leadId) {
			const lead = await this.leadsRepository.findById(aiSession.leadId);

			if (lead) {
				const entityResult = await this.domainEntityPort.createFromScreening({
					lead,
					aiSession,
					collectedData: agentOutput.collectedData,
					today,
				});

				if (entityResult.isRight()) {
					domainEntityId = entityResult.value.entityId;
				} else {
					console.error(
						"[Framework] DomainEntityPort.createFromScreening() falhou:",
						entityResult.value,
					);
				}
			}
		}

		// 2) Disparar hook de transição (com domainEntityId no contexto)
		await this.onStatusTransition?.["FORWARDED"]?.({
			previousStatus,
			newStatus: "FORWARDED",
			aiSession,
			collectedData: agentOutput.collectedData,
			contactName: agentOutput.contactName,
			today,
			domainEntityId,
		});

		return right({
			messageToClient: agentOutput.nextQuestionToClient,
			screeningCompleted: true,
		});
	}
}
import type { AiSession, ScreeningFlow } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { WorkspaceNotConfiguredError } from "./errors/workspace-not-configured-error";
import { ScreeningFlowNotMatchedError } from "./errors/screening-flow-not-matched-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";
import { AgentResponseError } from "@/core/agents/errors/agent-response-error";
import type { ChatMessage } from "@/core/agents/types/chat-message";
import type { IdentifierAgent } from "@/core/agents/ports/identifier-agent.port";
import type { ChatMemoryPort } from "@/core/agents/ports/chat-memory.port";

interface ProcessMessageIdentifyingAgentRequest {
	aiSession: AiSession;
	messageText: string;
}

type ProcessMessageIdentifyingAgentResponse = Either<
	AgentResponseError | WorkspaceNotConfiguredError | ScreeningFlowNotMatchedError,
	{ messageToClient: string; identified: boolean }
>;

const NOT_IDENTIFIED = "nao_identificado";

function buildChatMemoryKey(chatId: string): string {
	return `${chatId}-recepcao`;
}

export class ProcessMessageIdentifyingAgentUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository,
		private readonly aiSessionRepository: AiSessionRepository,
		private readonly workspacesRepository: WorkspacesRepository,
		private readonly identifierAgent: IdentifierAgent,
		private readonly chatMemoryProvider: ChatMemoryPort,
		private readonly workspaceLabel: string,
	) {}

	async execute({
		aiSession,
		messageText,
	}: ProcessMessageIdentifyingAgentRequest): Promise<ProcessMessageIdentifyingAgentResponse> {
		const workspace = await this.workspacesRepository.findFirst();

		if (!workspace) {
			return left(new WorkspaceNotConfiguredError());
		}

		const allScreeningFlows = await this.fetchAllScreeningFlows();
		const caseTypes = allScreeningFlows.map((sf) => sf.caseType);

		const memoryKey = buildChatMemoryKey(aiSession.chatId);
		const chatHistory = await this.chatMemoryProvider.getHistory(memoryKey);

		const agentResult = await this.identifierAgent.identify({
			message: messageText,
			workspaceLabel: this.workspaceLabel,
			caseTypes,
			chatHistory,
		});

		if (agentResult.isLeft()) {
			return left(agentResult.value);
		}

		const agentOutput = agentResult.value;

		const updatedHistory: ChatMessage[] = [
			...chatHistory,
			{ role: "user", content: messageText },
			{ role: "model", content: agentOutput.messageToClient },
		];
		await this.chatMemoryProvider.saveHistory(memoryKey, updatedHistory);

		const categoryIdentified =
			agentOutput.identifiedCategory !== NOT_IDENTIFIED;
		const nameIdentified = agentOutput.contactName !== NOT_IDENTIFIED;
		const identified = categoryIdentified && nameIdentified;

		if (!identified) {
			return right({
				messageToClient: agentOutput.messageToClient,
				identified: false,
			});
		}

		const matchedFlow = allScreeningFlows.find(
			(sf) => sf.caseType === agentOutput.identifiedCategory,
		);

		if (!matchedFlow) {
			return left(
				new ScreeningFlowNotMatchedError(agentOutput.identifiedCategory),
			);
		}

		aiSession.status = "INTERVIEWING";
		aiSession.screeningFlowId = matchedFlow.id;
		aiSession.name = agentOutput.contactName;
		aiSession.isThirdParty = agentOutput.isThirdParty;

		await this.aiSessionRepository.save(aiSession);

		return right({
			messageToClient: agentOutput.messageToClient,
			identified: true,
		});
	}

	private async fetchAllScreeningFlows(): Promise<ScreeningFlow[]> {
		const allFlows: ScreeningFlow[] = [];
		let page = 1;

		while (true) {
			const result = await this.screeningFlowsRepository.findMany({ page });
			allFlows.push(...result.items);

			if (allFlows.length >= result.total) {
				break;
			}

			page++;
		}

		return allFlows;
	}
}
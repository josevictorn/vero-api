import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { RedisChatMemoryProvider } from "@/providers/agents/memory/redis-chat-memory-provider";
import { GeminiIdentifierAgent } from "@/providers/agents/identifier/gemini-identifier-agent";
import { ProcessMessageIdentifyingAgentUseCase } from "../process-message-identifying-agent";

export function makeProcessMessageIdentifyingAgentUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const aiSessionRepository = new PrismaAiSessionRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const identifierAgent = new GeminiIdentifierAgent();
	const chatMemoryProvider = new RedisChatMemoryProvider();

	return new ProcessMessageIdentifyingAgentUseCase(
		screeningFlowsRepository,
		aiSessionRepository,
		workspacesRepository,
		identifierAgent,
		chatMemoryProvider,
	);
}

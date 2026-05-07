import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { GeminiIdentifierAgent } from "@/providers/agents/identifier/gemini-identifier-agent";
import { RedisChatMemoryProvider } from "@/providers/agents/memory/redis-chat-memory-provider";
import { ProcessMessageIdentifyingAgentUseCase } from "@/use-cases/agents/process-message-identifying-agent";

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

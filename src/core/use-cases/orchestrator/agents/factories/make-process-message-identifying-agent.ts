import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { RedisChatMemoryProvider } from "@/providers/agents/memory/redis-chat-memory-provider";
import { ProcessMessageIdentifyingAgentUseCase } from "../process-message-identifying-agent";
import type { InstanceConfig } from "@/core/config/instance-config.port";

export function makeProcessMessageIdentifyingAgentUseCase(config: InstanceConfig) {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const aiSessionRepository = new PrismaAiSessionRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const chatMemoryProvider = new RedisChatMemoryProvider();

	return new ProcessMessageIdentifyingAgentUseCase(
		screeningFlowsRepository,
		aiSessionRepository,
		workspacesRepository,
		config.agents.identifier,
		chatMemoryProvider,
		config.workspaceLabel,
		config.onStatusTransition,
	);
}

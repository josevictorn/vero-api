import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { RedisChatMemoryProvider } from "@/providers/agents/memory/redis-chat-memory-provider";
import { ProcessInterviewInterviewerAgentUseCase } from "../process-interview-interviewer-agent";
import type { InstanceConfig } from "@/core/config/instance-config.port";

export function makeProcessInterviewInterviewerAgentUseCase(config: InstanceConfig) {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const aiSessionRepository = new PrismaAiSessionRepository();
	const chatMemoryProvider = new RedisChatMemoryProvider();

	return new ProcessInterviewInterviewerAgentUseCase(
		screeningFlowsRepository,
		aiSessionRepository,
		config.agents.interviewer,
		chatMemoryProvider,
		config.onScreeningCompleted,
	);
}

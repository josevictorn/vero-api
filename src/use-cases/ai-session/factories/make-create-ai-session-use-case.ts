import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { CreateAiSessionUseCase } from "@/use-cases/ai-session/create-ai-session";

export function makeCreateAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const createAiSessionUseCase = new CreateAiSessionUseCase(
		aiSessionRepository,
		screeningFlowsRepository
	);

	return createAiSessionUseCase;
}

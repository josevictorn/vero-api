import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { CreateAiSessionUseCase } from "../create-ai-session";

export function makeCreateAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const createAiSessionUseCase = new CreateAiSessionUseCase(
		aiSessionRepository,
		screeningFlowsRepository
	);

	return createAiSessionUseCase;
}

import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { GetAiSessionUseCase } from "../get-ai-session";

export function makeGetAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const getAiSessionUseCase = new GetAiSessionUseCase(aiSessionRepository);

	return getAiSessionUseCase;
}

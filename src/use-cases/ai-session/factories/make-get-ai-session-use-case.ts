import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { GetAiSessionUseCase } from "@/use-cases/ai-session/get-ai-session";

export function makeGetAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const getAiSessionUseCase = new GetAiSessionUseCase(aiSessionRepository);

	return getAiSessionUseCase;
}

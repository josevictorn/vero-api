import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { EditAiSessionUseCase } from "@/use-cases/ai-session/edit-ai-session";

export function makeEditAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const editAiSessionUseCase = new EditAiSessionUseCase(
		aiSessionRepository,
		screeningFlowsRepository
	);

	return editAiSessionUseCase;
}

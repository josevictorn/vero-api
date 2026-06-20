import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { EditAiSessionUseCase } from "../edit-ai-session";

export function makeEditAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const editAiSessionUseCase = new EditAiSessionUseCase(
		aiSessionRepository,
		screeningFlowsRepository
	);

	return editAiSessionUseCase;
}

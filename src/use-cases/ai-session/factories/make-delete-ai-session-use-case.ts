import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { DeleteAiSessionUseCase } from "@/use-cases/ai-session/delete-ai-session";

export function makeDeleteAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const deleteAiSessionUseCase = new DeleteAiSessionUseCase(
		aiSessionRepository
	);

	return deleteAiSessionUseCase;
}

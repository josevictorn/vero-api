import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { DeleteAiSessionUseCase } from "../delete-ai-session";

export function makeDeleteAiSessionUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const deleteAiSessionUseCase = new DeleteAiSessionUseCase(
		aiSessionRepository
	);

	return deleteAiSessionUseCase;
}

import { PrismaAiSessionRepository } from "@/repositories/prisma/prisma-ai-session-repository";
import { FetchAiSessionsUseCase } from "@/use-cases/ai-session/fetch-ai-sessions";

export function makeFetchAiSessionsUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const fetchAiSessionsUseCase = new FetchAiSessionsUseCase(
		aiSessionRepository
	);

	return fetchAiSessionsUseCase;
}

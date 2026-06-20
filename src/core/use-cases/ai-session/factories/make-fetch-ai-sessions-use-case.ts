import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { FetchAiSessionsUseCase } from "../fetch-ai-sessions";

export function makeFetchAiSessionsUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const fetchAiSessionsUseCase = new FetchAiSessionsUseCase(
		aiSessionRepository
	);

	return fetchAiSessionsUseCase;
}

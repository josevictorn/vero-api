import type { AiSession } from "@generated/prisma/client";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import { type Either, left, right } from "@/utils/either";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";

interface GetAiSessionUseCaseRequest {
	aiSessionId: string;
}

type GetAiSessionUseCaseResponse = Either<
	AiSessionNotFoundError,
	{ aiSession: AiSession }
>;

export class GetAiSessionUseCase {
	constructor(private readonly aiSessionRepository: AiSessionRepository) {}

	async execute({
		aiSessionId,
	}: GetAiSessionUseCaseRequest): Promise<GetAiSessionUseCaseResponse> {
		const aiSession = await this.aiSessionRepository.findById(aiSessionId);

		if (!aiSession) {
			return left(new AiSessionNotFoundError(aiSessionId));
		}

		return right({
			aiSession,
		});
	}
}

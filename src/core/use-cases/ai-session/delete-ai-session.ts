import { type Either, left, right } from "@/utils/either";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";

interface DeleteAiSessionUseCaseRequest {
	aiSessionId: string;
}

type DeleteAiSessionUseCaseResponse = Either<AiSessionNotFoundError, null>;

export class DeleteAiSessionUseCase {
	constructor(private readonly aiSessionRepository: AiSessionRepository) {}

	async execute({
		aiSessionId,
	}: DeleteAiSessionUseCaseRequest): Promise<DeleteAiSessionUseCaseResponse> {
		const aiSession = await this.aiSessionRepository.findById(aiSessionId);

		if (!aiSession) {
			return left(new AiSessionNotFoundError(aiSessionId));
		}

		await this.aiSessionRepository.delete(aiSessionId);

		return right(null);
	}
}

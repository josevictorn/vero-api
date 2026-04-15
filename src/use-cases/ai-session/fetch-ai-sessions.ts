import type { AiSession } from "@generated/prisma/client";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";

interface FetchAiSessionsUseCaseRequest {
	page: number;
}

type FetchAiSessionsUseCaseResponse = Either<
	InvalidPageError,
	{
		results: AiSession[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchAiSessionsUseCase {
	constructor(private readonly aiSessionRepository: AiSessionRepository) {}

	async execute({
		page,
	}: FetchAiSessionsUseCaseRequest): Promise<FetchAiSessionsUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const aiSessions = await this.aiSessionRepository.findMany({ page });

		return right({
			results: aiSessions.items,
			meta: {
				currentPage: page,
				totalCount: aiSessions.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

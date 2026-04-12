import type { ScreeningFlow } from "@generated/prisma/client";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";

interface FetchScreeningFlowsUseCaseRequest {
	page: number;
}

type FetchScreeningFlowsUseCaseResponse = Either<
	InvalidPageError,
	{
		results: ScreeningFlow[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchScreeningFlowsUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		page,
	}: FetchScreeningFlowsUseCaseRequest): Promise<FetchScreeningFlowsUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const screeningFlows = await this.screeningFlowsRepository.findMany({ page });

		return right({
			results: screeningFlows.items,
			meta: {
				currentPage: page,
				totalCount: screeningFlows.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

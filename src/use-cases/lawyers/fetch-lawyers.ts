import type { Lawyer } from "@generated/prisma/client";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";

interface FetchLawyersUseCaseRequest {
	page: number;
}

type FetchLawyersUseCaseResponse = Either<
	InvalidPageError,
	{
		results: Lawyer[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchLawyersUseCase {
	constructor(private readonly lawyersRepository: LawyersRepository) {}

	async execute({
		page,
	}: FetchLawyersUseCaseRequest): Promise<FetchLawyersUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const lawyers = await this.lawyersRepository.findMany({ page });

		return right({
			results: lawyers.items,
			meta: {
				currentPage: page,
				totalCount: lawyers.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

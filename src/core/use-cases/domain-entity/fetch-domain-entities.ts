import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import type { DomainEntity, DomainEntityPort } from "@/core/ports/domain-entity.port";
import type { PaginatedResult } from "@/utils/paginated-results";
import { InvalidPageError } from "@/core/use-cases/leads/errors/invalid-page-error";

interface FetchDomainEntitiesUseCaseRequest {
	page: number;
}

type FetchDomainEntitiesUseCaseResponse = Either<
	InvalidPageError,
	{
		results: DomainEntity[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchDomainEntitiesUseCase {
	constructor(private readonly port: DomainEntityPort) {}

	async execute({
		page,
	}: FetchDomainEntitiesUseCaseRequest): Promise<FetchDomainEntitiesUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const result: PaginatedResult<DomainEntity> = await this.port.findMany({ page });

		return right({
			results: result.items,
			meta: {
				currentPage: page,
				totalCount: result.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

import type { Lead } from "@generated/prisma/client";
import type { LeadsRepository } from "@/repositories/leads-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";

interface FetchLeadsUseCaseRequest {
	page: number;
}

type FetchLeadsUseCaseResponse = Either<
	InvalidPageError,
	{
		results: Lead[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchLeadsUseCase {
	constructor(private readonly leadsRepository: LeadsRepository) {}

	async execute({
		page,
	}: FetchLeadsUseCaseRequest): Promise<FetchLeadsUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const leads = await this.leadsRepository.findMany({ page });

		return right({
			results: leads.items,
			meta: {
				currentPage: page,
				totalCount: leads.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

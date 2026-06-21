import { Either, left, right } from "@/utils/either";
import type { ScreeningReport } from "@generated/prisma/client";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";

export class InvalidPageError extends Error {
	constructor() {
		super("Page must be greater than or equal to 1.");
		this.name = "InvalidPageError";
	}
}

interface FetchScreeningReportsRequest {
	page: number;
}

type FetchScreeningReportsResponse = Either<
	InvalidPageError,
	{
		results: ScreeningReport[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchScreeningReportsUseCase {
	constructor(
		private readonly screeningReportRepository: ScreeningReportRepository,
	) {}

	async execute({
		page,
	}: FetchScreeningReportsRequest): Promise<FetchScreeningReportsResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const result = await this.screeningReportRepository.findMany({ page });

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

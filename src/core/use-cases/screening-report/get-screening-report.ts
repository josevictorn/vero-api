import { Either, left, right } from "@/utils/either";
import type { ScreeningReport } from "@generated/prisma/client";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import { ScreeningReportNotFoundError } from "./errors/screening-report-not-found-error";

interface GetScreeningReportRequest {
	screeningReportId: string;
}

type GetScreeningReportResponse = Either<
	ScreeningReportNotFoundError,
	{ screeningReport: ScreeningReport }
>;

export class GetScreeningReportUseCase {
	constructor(
		private readonly screeningReportRepository: ScreeningReportRepository,
	) {}

	async execute({
		screeningReportId,
	}: GetScreeningReportRequest): Promise<GetScreeningReportResponse> {
		const screeningReport = await this.screeningReportRepository.findById(screeningReportId);

		if (!screeningReport) {
			return left(new ScreeningReportNotFoundError(screeningReportId));
		}

		return right({ screeningReport });
	}
}

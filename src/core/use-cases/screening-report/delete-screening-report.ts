import { Either, left, right } from "@/utils/either";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import { ScreeningReportNotFoundError } from "./errors/screening-report-not-found-error";

interface DeleteScreeningReportRequest {
	screeningReportId: string;
}

type DeleteScreeningReportResponse = Either<ScreeningReportNotFoundError, null>;

export class DeleteScreeningReportUseCase {
	constructor(
		private readonly screeningReportRepository: ScreeningReportRepository,
	) {}

	async execute({
		screeningReportId,
	}: DeleteScreeningReportRequest): Promise<DeleteScreeningReportResponse> {
		const screeningReport = await this.screeningReportRepository.findById(screeningReportId);

		if (!screeningReport) {
			return left(new ScreeningReportNotFoundError(screeningReportId));
		}

		await this.screeningReportRepository.delete(screeningReportId);

		return right(null);
	}
}

import { Either, left, right } from "@/utils/either";
import type { Prisma, ScreeningReport } from "@generated/prisma/client";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import { ScreeningReportNotFoundError } from "./errors/screening-report-not-found-error";

interface EditScreeningReportRequest {
	screeningReportId: string;
	title?: string;
	summary?: string;
	/** Payload Json a ser mesclado no campo `data` existente. */
	data?: Record<string, unknown>;
}

type EditScreeningReportResponse = Either<
	ScreeningReportNotFoundError,
	{ screeningReport: ScreeningReport }
>;

export class EditScreeningReportUseCase {
	constructor(
		private readonly screeningReportRepository: ScreeningReportRepository,
	) {}

	async execute({
		screeningReportId,
		title,
		summary,
		data,
	}: EditScreeningReportRequest): Promise<EditScreeningReportResponse> {
		const screeningReport = await this.screeningReportRepository.findById(screeningReportId);

		if (!screeningReport) {
			return left(new ScreeningReportNotFoundError(screeningReportId));
		}

		screeningReport.title = title ?? screeningReport.title;
		screeningReport.summary = summary ?? screeningReport.summary;

		// Merge do data: preserva campos existentes e sobrescreve os enviados
		if (data) {
			const existing = (screeningReport.data as Record<string, unknown>) ?? {};
			screeningReport.data = { ...existing, ...data } as unknown as Prisma.JsonValue;
		}

		const updated = await this.screeningReportRepository.save(screeningReport);

		return right({ screeningReport: updated });
	}
}

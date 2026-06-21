import { Either, left, right } from "@/utils/either";
import type { Prisma, ScreeningReport } from "@generated/prisma/client";
import type { ScreeningReportRepository } from "@/core/repositories/screening-report-repository";
import type { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";

interface CreateScreeningReportRequest {
	aiSessionId: string;
	leadId: string;
	title: string;
	summary: string;
	data: Record<string, unknown>;
}

type CreateScreeningReportResponse = Either<
	AiSessionNotFoundError,
	{ screeningReport: ScreeningReport }
>;

export class CreateScreeningReportUseCase {
	constructor(
		private readonly screeningReportRepository: ScreeningReportRepository,
		private readonly aiSessionRepository: AiSessionRepository,
	) {}

	async execute({
		aiSessionId,
		leadId,
		title,
		summary,
		data,
	}: CreateScreeningReportRequest): Promise<CreateScreeningReportResponse> {
		const aiSession = await this.aiSessionRepository.findById(aiSessionId);
		if (!aiSession) {
			return left(new AiSessionNotFoundError(aiSessionId));
		}

		const screeningReport = await this.screeningReportRepository.create({
			aiSessionId,
			leadId,
			title,
			summary,
			data: data as Prisma.InputJsonValue,
		});

		return right({ screeningReport });
	}
}

import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { CreateScreeningReportUseCase } from "../create-screening-report";

export function makeCreateScreeningReportUseCase() {
	return new CreateScreeningReportUseCase(
		new PrismaScreeningReportRepository(),
		new PrismaAiSessionRepository(),
	);
}

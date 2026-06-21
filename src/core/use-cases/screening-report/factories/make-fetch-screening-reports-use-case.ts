import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { FetchScreeningReportsUseCase } from "../fetch-screening-reports";

export function makeFetchScreeningReportsUseCase() {
	return new FetchScreeningReportsUseCase(new PrismaScreeningReportRepository());
}

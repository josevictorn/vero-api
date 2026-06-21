import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { GetScreeningReportUseCase } from "../get-screening-report";

export function makeGetScreeningReportUseCase() {
	return new GetScreeningReportUseCase(new PrismaScreeningReportRepository());
}

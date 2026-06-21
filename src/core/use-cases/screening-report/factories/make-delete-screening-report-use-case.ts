import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { DeleteScreeningReportUseCase } from "../delete-screening-report";

export function makeDeleteScreeningReportUseCase() {
	return new DeleteScreeningReportUseCase(new PrismaScreeningReportRepository());
}

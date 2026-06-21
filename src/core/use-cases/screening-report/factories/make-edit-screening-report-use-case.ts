import { PrismaScreeningReportRepository } from "@/core/repositories/prisma/prisma-screening-report-repository";
import { EditScreeningReportUseCase } from "../edit-screening-report";

export function makeEditScreeningReportUseCase() {
	return new EditScreeningReportUseCase(new PrismaScreeningReportRepository());
}

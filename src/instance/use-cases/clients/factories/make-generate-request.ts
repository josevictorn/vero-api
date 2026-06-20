import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { makeGoogleDriveDocsGateway } from "@/infra/google/make-google-drive-docs-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { GenerateRequestUseCase } from "../generate-request";

export function makeGenerateRequestUseCase() {
    const clientsRepository = new PrismaClientsRepository();
    const lawyersRepository = new PrismaLawyersRepository();
    const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
    const calendarConnectionsRepository = new PrismaCalendarConnectionsRepository();
    const driveDocsGateway = makeGoogleDriveDocsGateway();
    const calendarGateway = makeGoogleCalendarGateway();

    return new GenerateRequestUseCase(
        clientsRepository,
        lawyersRepository,
        caseAnalysisRepository,
        driveDocsGateway,
        calendarConnectionsRepository,
        calendarGateway
    );
}

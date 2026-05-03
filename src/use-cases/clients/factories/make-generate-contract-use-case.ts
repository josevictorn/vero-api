import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { makeGoogleDriveDocsGateway } from "@/infra/google/make-google-drive-docs-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { GenerateContractUseCase } from "@/use-cases/clients/generate-contract";

export function makeGenerateContractUseCase() {
	const clientsRepository = new PrismaClientsRepository();
	const lawyersRepository = new PrismaLawyersRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const calendarConnectionsRepository =
		new PrismaCalendarConnectionsRepository();
	const driveDocsGateway = makeGoogleDriveDocsGateway();
	const calendarGateway = makeGoogleCalendarGateway();

	return new GenerateContractUseCase(
		clientsRepository,
		lawyersRepository,
		workspacesRepository,
		driveDocsGateway,
		calendarConnectionsRepository,
		calendarGateway
	);
}

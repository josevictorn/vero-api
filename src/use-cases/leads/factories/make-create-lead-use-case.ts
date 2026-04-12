import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { CreateLeadUseCase } from "@/use-cases/leads/create-lead";

export function makeCreateLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const usersRepository = new PrismaUsersRepository();
	const createLeadUseCase = new CreateLeadUseCase(
		leadsRepository,
		workspacesRepository,
		usersRepository
	);

	return createLeadUseCase;
}

import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { CreateLeadUseCase } from "../create-lead";

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

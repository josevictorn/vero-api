import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { EditLeadUseCase } from "@/use-cases/leads/edit-lead";

export function makeEditLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const usersRepository = new PrismaUsersRepository();
	const editLeadUseCase = new EditLeadUseCase(
		leadsRepository,
		workspacesRepository,
		usersRepository
	);

	return editLeadUseCase;
}

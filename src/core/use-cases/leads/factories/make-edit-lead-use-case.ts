import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { EditLeadUseCase } from "../edit-lead";

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

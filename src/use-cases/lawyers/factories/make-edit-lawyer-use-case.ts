import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { EditLawyerUseCase } from "@/use-cases/lawyers/edit-lawyer";

export function makeEditLawyerUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const usersRepository = new PrismaUsersRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const editLawyerUseCase = new EditLawyerUseCase(
		lawyersRepository,
		usersRepository,
		workspacesRepository
	);

	return editLawyerUseCase;
}

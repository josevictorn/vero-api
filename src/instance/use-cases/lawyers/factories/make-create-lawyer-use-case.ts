import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { CreateLawyerUseCase } from "../create-lawyer";

export function makeCreateLawyerUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const usersRepository = new PrismaUsersRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const createLawyerUseCase = new CreateLawyerUseCase(
		lawyersRepository,
		usersRepository,
		workspacesRepository
	);

	return createLawyerUseCase;
}

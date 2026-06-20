import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { EditClientUseCase } from "../edit-client";

export function makeEditClientUseCase() {
	const clientsRepository = new PrismaClientsRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const lawyersRepository = new PrismaLawyersRepository();

	const editClientUseCase = new EditClientUseCase(
		clientsRepository,
		lawyersRepository,
		workspacesRepository
	);

	return editClientUseCase;
}

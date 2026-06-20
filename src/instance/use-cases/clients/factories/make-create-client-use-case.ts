import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { CreateClientUseCase } from "../create-client";

export function makeCreateClientUseCase() {
	const clientsRepository = new PrismaClientsRepository();
	const workspacesRepository = new PrismaWorkspacesRepository();
	const lawyersRepository = new PrismaLawyersRepository();

	const createClientUseCase = new CreateClientUseCase(
		clientsRepository,
		workspacesRepository,
		lawyersRepository
	);

	return createClientUseCase;
}

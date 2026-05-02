import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { CreateClientUseCase } from "../create-client";

export function makeCreateClientUseCase() {
    const clientsRepository = new PrismaClientsRepository();
    const workspacesRepository = new PrismaWorkspacesRepository();
    const usersRepository = new PrismaUsersRepository();

    const createClientUseCase = new CreateClientUseCase(
        clientsRepository,
        workspacesRepository,
        usersRepository,
    );

    return createClientUseCase;
}

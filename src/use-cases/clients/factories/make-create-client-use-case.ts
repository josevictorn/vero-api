import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { CreateClientUseCase } from "../create-client";
import {PrismaLawyersRepository} from "@/repositories/prisma/prisma-lawyers-repository";

export function makeCreateClientUseCase() {
    const clientsRepository = new PrismaClientsRepository();
    const workspacesRepository = new PrismaWorkspacesRepository();
    const lawyersRepository = new PrismaLawyersRepository();

    const createClientUseCase = new CreateClientUseCase(
        clientsRepository,
        workspacesRepository,
        lawyersRepository,
    );

    return createClientUseCase;
}

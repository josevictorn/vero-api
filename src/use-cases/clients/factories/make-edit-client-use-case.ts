import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { EditClientUseCase } from "../edit-client";
import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";

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

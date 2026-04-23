import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { EditClientUseCase } from "../edit-client";
import {PrismaUsersRepository} from "@/repositories/prisma/prisma-users-repository";

export function makeEditClientUseCase() {
    const clientsRepository = new PrismaClientsRepository();
    const workspacesRepository = new PrismaWorkspacesRepository();
    const usersRepository = new PrismaUsersRepository();

    const editClientUseCase = new EditClientUseCase(
        clientsRepository,
        usersRepository,
        workspacesRepository
    );

    return editClientUseCase;
}

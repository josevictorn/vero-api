import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { GetClientUseCase } from "../get-clients";

export function makeGetClientUseCase() {
    const clientsRepository = new PrismaClientsRepository();
    const getClientUseCase = new GetClientUseCase(clientsRepository);

    return getClientUseCase;
}

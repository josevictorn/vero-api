import { type Either, left, right } from "@/utils/either";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { Client } from "@generated/prisma/client";
import { ClientsRepository } from "@/repositories/clients-repository";

interface GetClientUseCaseRequest {
    clientId: string;
}

type GetClientUseCaseResponse = Either<ClientNotFoundError, { client: Client }>;

export class GetClientUseCase {
    constructor(private readonly clientsRepository: ClientsRepository) {}

    async execute({ 
        clientId 
    }: GetClientUseCaseRequest): Promise<GetClientUseCaseResponse> {
        const client = await this.clientsRepository.findById(clientId);

        if (!client) {
            return left(new ClientNotFoundError(clientId));
        }

        return right({ client });
    }
}

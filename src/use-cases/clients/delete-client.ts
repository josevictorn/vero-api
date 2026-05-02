import type { ClientsRepository } from "@/repositories/clients-repository";
import { type Either, left, right } from "@/utils/either";
import { ClientNotFoundError } from "./errors/client-not-found-error";

interface DeleteClientUseCaseRequest {
	clientId: string;
}

type DeleteClientUseCaseResponse = Either<ClientNotFoundError, null>;

export class DeleteClientUseCase {
	constructor(private readonly clientsRepository: ClientsRepository) {}

	async execute({
		clientId,
	}: DeleteClientUseCaseRequest): Promise<DeleteClientUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId);

		if (!client) {
			return left(new ClientNotFoundError(clientId));
		}

		await this.clientsRepository.delete(clientId);

		return right(null);
	}
}

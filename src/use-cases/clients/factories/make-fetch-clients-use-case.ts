import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { FetchClientsUseCase } from "../fetch-clients";

export function makeFetchClientsUseCase() {
	const clientsRepository = new PrismaClientsRepository();
	const fetchClientsUseCase = new FetchClientsUseCase(clientsRepository);

	return fetchClientsUseCase;
}

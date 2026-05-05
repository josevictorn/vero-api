import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { FetchLawyersUseCase } from "@/use-cases/lawyers/fetch-lawyers";

export function makeFetchLawyersUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const usersRepository = new PrismaUsersRepository();
	const fetchLawyersUseCase = new FetchLawyersUseCase(
		lawyersRepository,
		usersRepository
	);

	return fetchLawyersUseCase;
}

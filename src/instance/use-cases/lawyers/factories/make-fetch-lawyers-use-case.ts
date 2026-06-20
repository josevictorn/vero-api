import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { FetchLawyersUseCase } from "../fetch-lawyers";

export function makeFetchLawyersUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const usersRepository = new PrismaUsersRepository();
	const fetchLawyersUseCase = new FetchLawyersUseCase(
		lawyersRepository,
		usersRepository
	);

	return fetchLawyersUseCase;
}

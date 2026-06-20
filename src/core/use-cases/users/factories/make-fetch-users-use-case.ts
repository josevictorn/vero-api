import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { FetchUsersUseCase } from "../fetch-users";

export function makeFetchUsersUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const fetchUsersUseCase = new FetchUsersUseCase(usersRepository);

	return fetchUsersUseCase;
}

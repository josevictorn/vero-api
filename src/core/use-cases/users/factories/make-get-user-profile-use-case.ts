import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { GetUserProfileUseCase } from "../get-user-profile";

export function makeGetUserProfileUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const getProfileUseCase = new GetUserProfileUseCase(usersRepository);

	return getProfileUseCase;
}

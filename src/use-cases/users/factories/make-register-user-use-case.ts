import { PrismaUsersRepository } from "@repositories/prisma/prisma-users-repository";
import { RegisterUserUseCase } from "@usecases/users/register";

export function makeRegisterUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const registerUseCase = new RegisterUserUseCase(usersRepository);

	return registerUseCase;
}

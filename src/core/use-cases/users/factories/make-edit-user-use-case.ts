import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { EditUserUseCase } from "../edit-user";

export function makeEditUserUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const editUserUseCase = new EditUserUseCase(usersRepository);

	return editUserUseCase;
}

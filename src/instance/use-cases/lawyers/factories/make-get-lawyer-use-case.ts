import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { PrismaUsersRepository } from "@/core/repositories/prisma/prisma-users-repository";
import { GetLawyerUseCase } from "../get-lawyer";

export function makeGetLawyerUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const usersRepository = new PrismaUsersRepository();
	const getLawyerUseCase = new GetLawyerUseCase(
		lawyersRepository,
		usersRepository
	);

	return getLawyerUseCase;
}

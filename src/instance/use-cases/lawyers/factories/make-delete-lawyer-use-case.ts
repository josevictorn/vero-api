import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { DeleteLawyerUseCase } from "../delete-lawyer";

export function makeDeleteLawyerUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const deleteLawyerUseCase = new DeleteLawyerUseCase(lawyersRepository);

	return deleteLawyerUseCase;
}

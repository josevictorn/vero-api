import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { GetLawyerUseCase } from "@/use-cases/lawyers/get-lawyer";

export function makeGetLawyerUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const getLawyerUseCase = new GetLawyerUseCase(lawyersRepository);

	return getLawyerUseCase;
}

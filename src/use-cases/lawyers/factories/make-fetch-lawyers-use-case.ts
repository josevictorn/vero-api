import { PrismaLawyersRepository } from "@/repositories/prisma/prisma-lawyers-repository";
import { FetchLawyersUseCase } from "@/use-cases/lawyers/fetch-lawyers";

export function makeFetchLawyersUseCase() {
	const lawyersRepository = new PrismaLawyersRepository();
	const fetchLawyersUseCase = new FetchLawyersUseCase(lawyersRepository);

	return fetchLawyersUseCase;
}

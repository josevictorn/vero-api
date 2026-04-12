import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { FetchScreeningFlowsUseCase } from "@/use-cases/screening-flows/fetch-screening-flows";

export function makeFetchScreeningFlowsUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const fetchScreeningFlowsUseCase = new FetchScreeningFlowsUseCase(
		screeningFlowsRepository
	);

	return fetchScreeningFlowsUseCase;
}

import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { FetchScreeningFlowsUseCase } from "../fetch-screening-flows";

export function makeFetchScreeningFlowsUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const fetchScreeningFlowsUseCase = new FetchScreeningFlowsUseCase(
		screeningFlowsRepository
	);

	return fetchScreeningFlowsUseCase;
}

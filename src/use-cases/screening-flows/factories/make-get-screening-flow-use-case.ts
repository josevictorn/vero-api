import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { GetScreeningFlowUseCase } from "@/use-cases/screening-flows/get-screening-flow";

export function makeGetScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const getScreeningFlowUseCase = new GetScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return getScreeningFlowUseCase;
}

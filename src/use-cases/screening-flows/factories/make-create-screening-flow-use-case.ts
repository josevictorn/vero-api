import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { CreateScreeningFlowUseCase } from "@/use-cases/screening-flows/create-screening-flow";

export function makeCreateScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const createScreeningFlowUseCase = new CreateScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return createScreeningFlowUseCase;
}

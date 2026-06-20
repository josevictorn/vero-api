import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { CreateScreeningFlowUseCase } from "../create-screening-flow";

export function makeCreateScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const createScreeningFlowUseCase = new CreateScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return createScreeningFlowUseCase;
}

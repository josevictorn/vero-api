import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { GetScreeningFlowUseCase } from "../get-screening-flow";

export function makeGetScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const getScreeningFlowUseCase = new GetScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return getScreeningFlowUseCase;
}

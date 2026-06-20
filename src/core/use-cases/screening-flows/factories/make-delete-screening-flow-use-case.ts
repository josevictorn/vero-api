import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { DeleteScreeningFlowUseCase } from "../delete-screening-flow";

export function makeDeleteScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const deleteScreeningFlowUseCase = new DeleteScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return deleteScreeningFlowUseCase;
}

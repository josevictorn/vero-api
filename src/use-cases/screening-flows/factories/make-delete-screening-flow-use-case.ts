import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { DeleteScreeningFlowUseCase } from "@/use-cases/screening-flows/delete-screening-flow";

export function makeDeleteScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const deleteScreeningFlowUseCase = new DeleteScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return deleteScreeningFlowUseCase;
}

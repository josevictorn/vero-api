import { PrismaScreeningFlowsRepository } from "@/repositories/prisma/prisma-screening-flows-repository";
import { EditScreeningFlowUseCase } from "@/use-cases/screening-flows/edit-screening-flow";

export function makeEditScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const editScreeningFlowUseCase = new EditScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return editScreeningFlowUseCase;
}

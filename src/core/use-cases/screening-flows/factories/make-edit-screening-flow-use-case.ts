import { PrismaScreeningFlowsRepository } from "@/core/repositories/prisma/prisma-screening-flows-repository";
import { EditScreeningFlowUseCase } from "../edit-screening-flow";

export function makeEditScreeningFlowUseCase() {
	const screeningFlowsRepository = new PrismaScreeningFlowsRepository();
	const editScreeningFlowUseCase = new EditScreeningFlowUseCase(
		screeningFlowsRepository
	);

	return editScreeningFlowUseCase;
}

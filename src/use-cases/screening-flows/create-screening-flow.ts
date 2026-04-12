import type { Prisma, ScreeningFlow } from "@generated/prisma/client";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { type Either, right } from "@/utils/either";

interface CreateScreeningFlowUseCaseRequest {
	caseType: string;
	questions: Prisma.InputJsonValue;
}

type CreateScreeningFlowUseCaseResponse = Either<
	null,
	{ screeningFlow: ScreeningFlow }
>;

export class CreateScreeningFlowUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		caseType,
		questions,
	}: CreateScreeningFlowUseCaseRequest): Promise<CreateScreeningFlowUseCaseResponse> {
		const screeningFlow = await this.screeningFlowsRepository.create({
			caseType,
			questions,
		});

		return right({
			screeningFlow,
		});
	}
}

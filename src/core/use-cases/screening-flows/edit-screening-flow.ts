import type { Prisma, ScreeningFlow } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";

interface EditScreeningFlowUseCaseRequest {
	caseType?: string;
	questions?: Prisma.InputJsonValue;
	screeningFlowId: string;
}

type EditScreeningFlowUseCaseResponse = Either<
	ScreeningFlowNotFoundError,
	{ screeningFlow: ScreeningFlow }
>;

export class EditScreeningFlowUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		screeningFlowId,
		caseType,
		questions,
	}: EditScreeningFlowUseCaseRequest): Promise<EditScreeningFlowUseCaseResponse> {
		const screeningFlow =
			await this.screeningFlowsRepository.findById(screeningFlowId);

		if (!screeningFlow) {
			return left(new ScreeningFlowNotFoundError(screeningFlowId));
		}

		screeningFlow.caseType = caseType ?? screeningFlow.caseType;
		screeningFlow.questions =
			questions === undefined
				? screeningFlow.questions
				: (questions as Prisma.JsonValue);

		const updatedScreeningFlow =
			await this.screeningFlowsRepository.save(screeningFlow);

		return right({
			screeningFlow: updatedScreeningFlow,
		});
	}
}

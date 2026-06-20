import type { ScreeningFlow } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";

interface GetScreeningFlowUseCaseRequest {
	screeningFlowId: string;
}

type GetScreeningFlowUseCaseResponse = Either<
	ScreeningFlowNotFoundError,
	{ screeningFlow: ScreeningFlow }
>;

export class GetScreeningFlowUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		screeningFlowId,
	}: GetScreeningFlowUseCaseRequest): Promise<GetScreeningFlowUseCaseResponse> {
		const screeningFlow =
			await this.screeningFlowsRepository.findById(screeningFlowId);

		if (!screeningFlow) {
			return left(new ScreeningFlowNotFoundError(screeningFlowId));
		}

		return right({
			screeningFlow,
		});
	}
}

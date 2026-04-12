import type { ScreeningFlow } from "@generated/prisma/client";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

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

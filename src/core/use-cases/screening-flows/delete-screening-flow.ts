import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";

interface DeleteScreeningFlowUseCaseRequest {
	screeningFlowId: string;
}

type DeleteScreeningFlowUseCaseResponse = Either<
	ScreeningFlowNotFoundError,
	null
>;

export class DeleteScreeningFlowUseCase {
	constructor(
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		screeningFlowId,
	}: DeleteScreeningFlowUseCaseRequest): Promise<DeleteScreeningFlowUseCaseResponse> {
		const screeningFlow =
			await this.screeningFlowsRepository.findById(screeningFlowId);

		if (!screeningFlow) {
			return left(new ScreeningFlowNotFoundError(screeningFlowId));
		}

		await this.screeningFlowsRepository.delete(screeningFlowId);

		return right(null);
	}
}

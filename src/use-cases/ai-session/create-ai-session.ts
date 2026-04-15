import type { AiSession } from "@generated/prisma/client";
import type { InputJsonValue } from "@generated/prisma/models";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

interface CreateAiSessionUseCaseRequest {
	cellphone: string;
	chatId: string;
	chatState: InputJsonValue;
	isThirdParty?: boolean;
	name: string;
	screeningFlowId?: string;
	status: string;
}

type CreateAiSessionUseCaseResponse = Either<
	ScreeningFlowNotFoundError,
	{ aiSession: AiSession }
>;

export class CreateAiSessionUseCase {
	constructor(
		private readonly aiSessionRepository: AiSessionRepository,
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		screeningFlowId,
		chatId,
		status,
		chatState,
		name,
		cellphone,
		isThirdParty,
	}: CreateAiSessionUseCaseRequest): Promise<CreateAiSessionUseCaseResponse> {
		if (screeningFlowId) {
			const screeningFlow =
				await this.screeningFlowsRepository.findById(screeningFlowId);

			if (!screeningFlow) {
				return left(new ScreeningFlowNotFoundError(screeningFlowId));
			}
		}

		const aiSession = await this.aiSessionRepository.create({
			screeningFlowId,
			chatId,
			status,
			chatState,
			name,
			cellphone,
			isThirdParty,
		});

		return right({
			aiSession,
		});
	}
}

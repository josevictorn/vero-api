import type { AiSession, Prisma } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";


interface CreateAiSessionUseCaseRequest {
	cellphone: string;
	chatId: string;
	chatState: Prisma.InputJsonValue;
	isThirdParty?: boolean;
	name: string;
	screeningFlowId?: string;
	status?: string;
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

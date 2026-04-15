import type { AiSession } from "@generated/prisma/client";
import type { InputJsonValue } from "@generated/prisma/models";
import type { AiSessionRepository } from "@/repositories/ai-session-repository";
import type { ScreeningFlowsRepository } from "@/repositories/screening-flows-repository";
import { type Either, left, right } from "@/utils/either";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

interface EditAiSessionUseCaseRequest {
	aiSessionId: string;
	cellphone?: string;
	chatId?: string;
	chatState?: InputJsonValue;
	isThirdParty?: boolean;
	name?: string;
	screeningFlowId?: string | null;
	status?: string;
}

type EditAiSessionUseCaseResponse = Either<
	AiSessionNotFoundError | ScreeningFlowNotFoundError,
	{ aiSession: AiSession }
>;

export class EditAiSessionUseCase {
	constructor(
		private readonly aiSessionRepository: AiSessionRepository,
		private readonly screeningFlowsRepository: ScreeningFlowsRepository
	) {}

	async execute({
		aiSessionId,
		screeningFlowId,
		chatId,
		status,
		chatState,
		name,
		cellphone,
		isThirdParty,
	}: EditAiSessionUseCaseRequest): Promise<EditAiSessionUseCaseResponse> {
		const aiSession = await this.aiSessionRepository.findById(aiSessionId);

		if (!aiSession) {
			return left(new AiSessionNotFoundError(aiSessionId));
		}

		if (screeningFlowId) {
			const screeningFlow =
				await this.screeningFlowsRepository.findById(screeningFlowId);

			if (!screeningFlow) {
				return left(new ScreeningFlowNotFoundError(screeningFlowId));
			}
		}

		aiSession.screeningFlowId =
			screeningFlowId === undefined
				? aiSession.screeningFlowId
				: screeningFlowId;
		aiSession.chatId = chatId ?? aiSession.chatId;
		aiSession.status = status ?? aiSession.status;
		aiSession.chatState = chatState ?? aiSession.chatState;
		aiSession.name = name ?? aiSession.name;
		aiSession.cellphone = cellphone ?? aiSession.cellphone;
		aiSession.isThirdParty = isThirdParty ?? aiSession.isThirdParty;

		const updatedAiSession = await this.aiSessionRepository.save(aiSession);

		return right({
			aiSession: updatedAiSession,
		});
	}
}

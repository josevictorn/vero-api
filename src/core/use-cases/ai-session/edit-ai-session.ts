import type { AiSession, Prisma } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { ScreeningFlowsRepository } from "@/core/repositories/screening-flows-repository";

interface EditAiSessionUseCaseRequest {
	aiSessionId: string;
	cellphone?: string;
	chatId?: string;
	chatState?: Prisma.InputJsonValue;
	isThirdParty?: boolean;
	name?: string;
	screeningFlowId?: string | null;
	status?: string;
	leadId?: string | null;
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
		leadId,
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
		aiSession.chatState = (chatState as Prisma.JsonValue) ?? aiSession.chatState;
		aiSession.name = name ?? aiSession.name;
		aiSession.cellphone = cellphone ?? aiSession.cellphone;
		aiSession.isThirdParty = isThirdParty ?? aiSession.isThirdParty;
		aiSession.leadId = leadId !== undefined ? leadId : aiSession.leadId;

		const updatedAiSession = await this.aiSessionRepository.save(aiSession);

		return right({
			aiSession: updatedAiSession,
		});
	}
}

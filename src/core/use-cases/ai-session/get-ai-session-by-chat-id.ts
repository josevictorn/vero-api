import type { AiSession } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";

interface GetAiSessionByChatIdUseCaseRequest {
    aiSessionChatId: string;
}

type GetAiSessionByChatIdUseCaseResponse = Either<
    AiSessionNotFoundError,
    { aiSession: AiSession }
>;

export class GetAiSessionByChatIdUseCase {
    constructor(private readonly aiSessionRepository: AiSessionRepository) {}

    async execute({
        aiSessionChatId,
    }: GetAiSessionByChatIdUseCaseRequest): Promise<GetAiSessionByChatIdUseCaseResponse> {
        const aiSession = await this.aiSessionRepository.findByChatId(aiSessionChatId);

        if (!aiSession) {
            return left(new AiSessionNotFoundError(aiSessionChatId));
        }

        return right({
            aiSession,
        });
    }
}

import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { GetAiSessionByChatIdUseCase } from "../get-ai-session-by-chat-id";

export function makeGetAiSessionByChatIdUseCase() {
    const aiSessionRepository = new PrismaAiSessionRepository();
    const getAiSessionByChatIdUseCase = new GetAiSessionByChatIdUseCase(aiSessionRepository);

    return getAiSessionByChatIdUseCase;
}

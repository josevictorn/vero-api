import { beforeEach, describe, expect, it } from "vitest";
import { AiSessionStatus } from "@generated/prisma/client";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { GetAiSessionByChatIdUseCase } from "./get-ai-session-by-chat-id";

let aiSessionRepository: InMemoryAiSessionRepository;
let sut: GetAiSessionByChatIdUseCase;

describe("Get AI Session By Chat ID Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		sut = new GetAiSessionByChatIdUseCase(aiSessionRepository);
	});

	it("should be able to get ai session by chat id", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({ aiSessionChatId: aiSession.chatId });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			aiSession: expect.objectContaining({
				id: aiSession.id,
				name: aiSession.name,
				chatId: aiSession.chatId,
			}),
		});
	});

	it("should not be able to get non-existing ai session by chat id", async () => {
		const result = await sut.execute({ aiSessionChatId: "non-existing-chat-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});
});

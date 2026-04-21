import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { GetAiSessionUseCase } from "./get-ai-session";

let aiSessionRepository: InMemoryAiSessionRepository;
let sut: GetAiSessionUseCase;

describe("Get AI Session Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		sut = new GetAiSessionUseCase(aiSessionRepository);
	});

	it("should be able to get ai session by id", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: "active",
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({ aiSessionId: aiSession.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			aiSession: expect.objectContaining({
				id: aiSession.id,
				name: aiSession.name,
				chatId: aiSession.chatId,
			}),
		});
	});

	it("should not be able to get non-existing ai session", async () => {
		const result = await sut.execute({ aiSessionId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});
});

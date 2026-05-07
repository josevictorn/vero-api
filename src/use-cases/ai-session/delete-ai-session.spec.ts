import { beforeEach, describe, expect, it } from "vitest";
import { AiSessionStatus } from "@generated/prisma/client";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { DeleteAiSessionUseCase } from "./delete-ai-session";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";

let aiSessionRepository: InMemoryAiSessionRepository;
let sut: DeleteAiSessionUseCase;

describe("Delete AI Session Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		sut = new DeleteAiSessionUseCase(aiSessionRepository);
	});

	it("should be able to delete ai session", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({ aiSessionId: aiSession.id });

		expect(result.isRight()).toBe(true);
		expect(await aiSessionRepository.findById(aiSession.id)).toBeNull();
	});

	it("should not be able to delete non-existing ai session", async () => {
		const result = await sut.execute({ aiSessionId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});
});

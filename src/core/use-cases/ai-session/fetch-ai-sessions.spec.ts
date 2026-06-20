import { beforeEach, describe, expect, it } from "vitest";
import { AiSessionStatus } from "@generated/prisma/client";
import { InMemoryAiSessionRepository } from "@/core/repositories/in-memory/in-memory-ai-session-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchAiSessionsUseCase } from "./fetch-ai-sessions";

let aiSessionRepository: InMemoryAiSessionRepository;
let sut: FetchAiSessionsUseCase;

describe("Fetch AI Sessions Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		sut = new FetchAiSessionsUseCase(aiSessionRepository);
	});

	it("should be able to fetch ai sessions", async () => {
		const aiSession1 = await aiSessionRepository.create({
			chatId: "chat-001",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "Session 1",
			cellphone: "11999990001",
		});

		const aiSession2 = await aiSessionRepository.create({
			chatId: "chat-002",
			status: AiSessionStatus.BOOKED,
			chatState: { step: 3 },
			name: "Session 2",
			cellphone: "11999990002",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({
					id: aiSession1.id,
					chatId: aiSession1.chatId,
				}),
				expect.objectContaining({
					id: aiSession2.id,
					chatId: aiSession2.chatId,
				}),
			]),
			meta: {
				currentPage: 1,
				totalCount: 2,
				perPage: 20,
			},
		});
	});

	it("should not be able to fetch with invalid page", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});
});

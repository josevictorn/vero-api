import { beforeEach, describe, expect, it } from "vitest";
import { AiSessionStatus } from "@generated/prisma/client";
import { InMemoryAiSessionRepository } from "@/core/repositories/in-memory/in-memory-ai-session-repository";
import { InMemoryScreeningFlowsRepository } from "@/core/repositories/in-memory/in-memory-screening-flows-repository";
import { CreateAiSessionUseCase } from "./create-ai-session";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

let aiSessionRepository: InMemoryAiSessionRepository;
let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: CreateAiSessionUseCase;

describe("Create AI Session Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new CreateAiSessionUseCase(
			aiSessionRepository,
			screeningFlowsRepository
		);
	});

	it("should be able to create an ai session", async () => {
		const result = await sut.execute({
			chatId: "chat-123",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999998877",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.aiSession).toEqual(
				expect.objectContaining({
					chatId: "chat-123",
					status: AiSessionStatus.IDENTIFYING,
					name: "John Doe",
				})
			);
		}
	});

	it("should be able to create an ai session with screening flow", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ question: "What happened?" }],
		});

		const result = await sut.execute({
			screeningFlowId: screeningFlow.id,
			chatId: "chat-456",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "Jane Doe",
			cellphone: "11999998866",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.aiSession).toEqual(
				expect.objectContaining({
					screeningFlowId: screeningFlow.id,
					chatId: "chat-456",
				})
			);
		}
	});

	it("should not be able to create an ai session with non-existing screening flow", async () => {
		const result = await sut.execute({
			screeningFlowId: "non-existing-flow",
			chatId: "chat-789",
			status: AiSessionStatus.IDENTIFYING,
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999998877",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ScreeningFlowNotFoundError);
	});
});

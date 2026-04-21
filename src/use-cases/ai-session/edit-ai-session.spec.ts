import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { InMemoryScreeningFlowsRepository } from "@/repositories/in-memory/in-memory-screening-flows-repository";
import { EditAiSessionUseCase } from "./edit-ai-session";
import { AiSessionNotFoundError } from "./errors/ai-session-not-found-error";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

let aiSessionRepository: InMemoryAiSessionRepository;
let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: EditAiSessionUseCase;

describe("Edit AI Session Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new EditAiSessionUseCase(
			aiSessionRepository,
			screeningFlowsRepository
		);
	});

	it("should be able to edit an ai session", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: "active",
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({
			aiSessionId: aiSession.id,
			name: "Jane Doe",
			status: "completed",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.aiSession).toEqual(
				expect.objectContaining({
					id: aiSession.id,
					name: "Jane Doe",
					status: "completed",
					chatId: "chat-123",
				})
			);
		}
	});

	it("should be able to edit screening flow id", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ question: "What happened?" }],
		});

		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: "active",
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({
			aiSessionId: aiSession.id,
			screeningFlowId: screeningFlow.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.aiSession.screeningFlowId).toBe(screeningFlow.id);
		}
	});

	it("should be able to set screening flow id to null", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ question: "What happened?" }],
		});

		const aiSession = await aiSessionRepository.create({
			screeningFlowId: screeningFlow.id,
			chatId: "chat-123",
			status: "active",
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({
			aiSessionId: aiSession.id,
			screeningFlowId: null,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.aiSession.screeningFlowId).toBeNull();
		}
	});

	it("should not be able to edit non-existing ai session", async () => {
		const result = await sut.execute({
			aiSessionId: "non-existing-id",
			name: "Jane Doe",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});

	it("should not be able to edit with non-existing screening flow", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-123",
			status: "active",
			chatState: { step: 1 },
			name: "John Doe",
			cellphone: "11999990001",
		});

		const result = await sut.execute({
			aiSessionId: aiSession.id,
			screeningFlowId: "non-existing-flow",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ScreeningFlowNotFoundError);
	});
});

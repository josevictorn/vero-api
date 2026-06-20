import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAiSessionRepository } from "@/core/repositories/in-memory/in-memory-ai-session-repository";
import { InMemoryCaseAnalysisRepository } from "@/repositories/in-memory/in-memory-case-analysis-repository";
import { CreateCaseAnalysisUseCase } from "./create-case-analysis";
import { AiSessionStatus } from "@generated/prisma/client";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";

let aiSessionRepository: InMemoryAiSessionRepository;
let caseAnalysisRepository: InMemoryCaseAnalysisRepository;
let sut: CreateCaseAnalysisUseCase;

describe("Create Case Analysis Use Case", () => {
	beforeEach(() => {
		aiSessionRepository = new InMemoryAiSessionRepository();
		caseAnalysisRepository = new InMemoryCaseAnalysisRepository();
		sut = new CreateCaseAnalysisUseCase(
			aiSessionRepository,
			caseAnalysisRepository
		);
	});

	it("should be able to create a case analysis", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-1",
			status: AiSessionStatus.IDENTIFYING,
			chatState: {},
			name: "Session 1",
			cellphone: "11999990001",
		});

		const result = await sut.execute({
			aiSessionId: aiSession.id,
			leadId: "lead-1",
			title: "Análise Trabalhista",
			viabilityLabel: "Viável",
			analysisText: "Análise completa do caso.",
			estimatedComplexity: "Média",
			mainLegalBase: "CLT Art. 477",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.caseAnalysis).toEqual(
				expect.objectContaining({
					aiSessionId: aiSession.id,
					leadId: "lead-1",
					title: "Análise Trabalhista",
					viabilityLabel: "Viável",
				})
			);
		}
	});

	it("should not be able to create a case analysis with non-existing ai session", async () => {
		const result = await sut.execute({
			aiSessionId: "non-existing-session",
			leadId: "lead-1",
			title: "Análise Trabalhista",
			viabilityLabel: "Viável",
			analysisText: "Análise completa do caso.",
			estimatedComplexity: "Média",
			mainLegalBase: "CLT Art. 477",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});
});

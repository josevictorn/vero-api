import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAiSessionRepository } from "@/repositories/in-memory/in-memory-ai-session-repository";
import { InMemoryCaseAnalysisRepository } from "@/repositories/in-memory/in-memory-case-analysis-repository";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { AiSessionNotFoundError } from "../ai-session/errors/ai-session-not-found-error";
import { AiSessionStatus } from "@generated/prisma/client";
import { LeadNotFoundError } from "../leads/errors/lead-not-found-error";
import { EditCaseAnalysisUseCase } from "./edit-case-analysis";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";

let caseAnalysisRepository: InMemoryCaseAnalysisRepository;
let aiSessionRepository: InMemoryAiSessionRepository;
let leadsRepository: InMemoryLeadsRepository;
let sut: EditCaseAnalysisUseCase;

describe("Edit Case Analysis Use Case", () => {
	beforeEach(() => {
		caseAnalysisRepository = new InMemoryCaseAnalysisRepository();
		aiSessionRepository = new InMemoryAiSessionRepository();
		leadsRepository = new InMemoryLeadsRepository();
		sut = new EditCaseAnalysisUseCase(
			caseAnalysisRepository,
			aiSessionRepository,
			leadsRepository
		);
	});

	it("should be able to edit a case analysis", async () => {
		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise Original",
			viabilityLabel: "Viável",
			analysisText: "Texto original.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT Art. 477",
		});

		const result = await sut.execute({
			caseAnalysisId: caseAnalysis.id,
			title: "Análise Atualizada",
			viabilityLabel: "Inviável",
			estimatedComplexity: "Alta",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.caseAnalysis).toEqual(
				expect.objectContaining({
					id: caseAnalysis.id,
					title: "Análise Atualizada",
					viabilityLabel: "Inviável",
					estimatedComplexity: "Alta",
					analysisText: "Texto original.",
					mainLegalBase: "CLT Art. 477",
				})
			);
		}
	});

	it("should be able to edit with a new ai session", async () => {
		const aiSession = await aiSessionRepository.create({
			chatId: "chat-2",
			status: AiSessionStatus.IDENTIFYING,
			chatState: {},
			name: "Session 2",
			cellphone: "11999990002",
		});

		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise",
			viabilityLabel: "Viável",
			analysisText: "Texto.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT",
		});

		const result = await sut.execute({
			caseAnalysisId: caseAnalysis.id,
			aiSessionId: aiSession.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.caseAnalysis.aiSessionId).toBe(aiSession.id);
		}
	});

	it("should be able to edit with a new lead", async () => {
		const lead = await leadsRepository.create({
			workspaceId: "workspace-1",
			name: "Lead Novo",
			cellphone: "11999990003",
			email: "lead-novo@example.com",
		});

		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise",
			viabilityLabel: "Viável",
			analysisText: "Texto.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT",
		});

		const result = await sut.execute({
			caseAnalysisId: caseAnalysis.id,
			leadId: lead.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.caseAnalysis.leadId).toBe(lead.id);
		}
	});

	it("should not be able to edit non-existing case analysis", async () => {
		const result = await sut.execute({
			caseAnalysisId: "non-existing-id",
			title: "Análise Atualizada",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CaseAnalysisNotFoundError);
	});

	it("should not be able to edit with non-existing ai session", async () => {
		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise",
			viabilityLabel: "Viável",
			analysisText: "Texto.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT",
		});

		const result = await sut.execute({
			caseAnalysisId: caseAnalysis.id,
			aiSessionId: "non-existing-session",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(AiSessionNotFoundError);
	});

	it("should not be able to edit with non-existing lead", async () => {
		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise",
			viabilityLabel: "Viável",
			analysisText: "Texto.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT",
		});

		const result = await sut.execute({
			caseAnalysisId: caseAnalysis.id,
			leadId: "non-existing-lead",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadNotFoundError);
	});
});

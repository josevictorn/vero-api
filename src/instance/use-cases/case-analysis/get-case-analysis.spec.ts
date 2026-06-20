import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCaseAnalysisRepository } from "@/repositories/in-memory/in-memory-case-analysis-repository";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";
import { GetCaseAnalysisUseCase } from "./get-case-analysis";

let caseAnalysisRepository: InMemoryCaseAnalysisRepository;
let sut: GetCaseAnalysisUseCase;

describe("Get Case Analysis Use Case", () => {
	beforeEach(() => {
		caseAnalysisRepository = new InMemoryCaseAnalysisRepository();
		sut = new GetCaseAnalysisUseCase(caseAnalysisRepository);
	});

	it("should be able to get a case analysis by id", async () => {
		const caseAnalysis = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise Trabalhista",
			viabilityLabel: "Viável",
			analysisText: "Análise completa.",
			estimatedComplexity: "Média",
			mainLegalBase: "CLT Art. 477",
		});

		const result = await sut.execute({ caseAnalysisId: caseAnalysis.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			caseAnalysis: expect.objectContaining({
				id: caseAnalysis.id,
				title: caseAnalysis.title,
				viabilityLabel: caseAnalysis.viabilityLabel,
			}),
		});
	});

	it("should not be able to get non-existing case analysis", async () => {
		const result = await sut.execute({ caseAnalysisId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CaseAnalysisNotFoundError);
	});
});

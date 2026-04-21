import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCaseAnalysisRepository } from "@/repositories/in-memory/in-memory-case-analysis-repository";
import { DeleteCaseAnalysisUseCase } from "./delete-case-analysis";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";

let caseAnalysisRepository: InMemoryCaseAnalysisRepository;
let sut: DeleteCaseAnalysisUseCase;

describe("Delete Case Analysis Use Case", () => {
	beforeEach(() => {
		caseAnalysisRepository = new InMemoryCaseAnalysisRepository();
		sut = new DeleteCaseAnalysisUseCase(caseAnalysisRepository);
	});

	it("should be able to delete a case analysis", async () => {
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
		expect(await caseAnalysisRepository.findById(caseAnalysis.id)).toBeNull();
	});

	it("should not be able to delete non-existing case analysis", async () => {
		const result = await sut.execute({ caseAnalysisId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CaseAnalysisNotFoundError);
	});
});

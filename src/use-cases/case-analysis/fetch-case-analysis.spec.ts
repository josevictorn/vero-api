import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCaseAnalysisRepository } from "@/repositories/in-memory/in-memory-case-analysis-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchCaseAnalysisUseCase } from "./fetch-case-analysis";

let caseAnalysisRepository: InMemoryCaseAnalysisRepository;
let sut: FetchCaseAnalysisUseCase;

describe("Fetch Case Analysis Use Case", () => {
	beforeEach(() => {
		caseAnalysisRepository = new InMemoryCaseAnalysisRepository();
		sut = new FetchCaseAnalysisUseCase(caseAnalysisRepository);
	});

	it("should be able to fetch case analyses", async () => {
		const ca1 = await caseAnalysisRepository.create({
			aiSessionId: "session-1",
			leadId: "lead-1",
			title: "Análise 1",
			viabilityLabel: "Viável",
			analysisText: "Texto 1.",
			estimatedComplexity: "Baixa",
			mainLegalBase: "CLT Art. 477",
		});

		const ca2 = await caseAnalysisRepository.create({
			aiSessionId: "session-2",
			leadId: "lead-2",
			title: "Análise 2",
			viabilityLabel: "Inviável",
			analysisText: "Texto 2.",
			estimatedComplexity: "Alta",
			mainLegalBase: "CDC Art. 6",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({ id: ca1.id, title: ca1.title }),
				expect.objectContaining({ id: ca2.id, title: ca2.title }),
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

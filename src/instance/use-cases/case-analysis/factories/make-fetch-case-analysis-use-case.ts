import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { FetchCaseAnalysisUseCase } from "../fetch-case-analysis";

export function makeFetchCaseAnalysisUseCase() {
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const fetchCaseAnalysisUseCase = new FetchCaseAnalysisUseCase(caseAnalysisRepository);

	return fetchCaseAnalysisUseCase;
}

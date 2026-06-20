import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { GetCaseAnalysisUseCase } from "../get-case-analysis";

export function makeGetCaseAnalysisUseCase() {
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const getCaseAnalysisUseCase = new GetCaseAnalysisUseCase(caseAnalysisRepository);

	return getCaseAnalysisUseCase;
}

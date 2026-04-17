import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { DeleteCaseAnalysisUseCase } from "@/use-cases/case-analysis/delete-case-analysis";

export function makeDeleteCaseAnalysisUseCase() {
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const deleteCaseAnalysisUseCase = new DeleteCaseAnalysisUseCase(caseAnalysisRepository);

	return deleteCaseAnalysisUseCase;
}

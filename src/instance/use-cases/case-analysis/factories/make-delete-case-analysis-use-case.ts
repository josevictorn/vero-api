import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { DeleteCaseAnalysisUseCase } from "../delete-case-analysis";

export function makeDeleteCaseAnalysisUseCase() {
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const deleteCaseAnalysisUseCase = new DeleteCaseAnalysisUseCase(caseAnalysisRepository);

	return deleteCaseAnalysisUseCase;
}

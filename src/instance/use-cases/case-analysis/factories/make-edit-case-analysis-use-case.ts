import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { EditCaseAnalysisUseCase } from "../edit-case-analysis";

export function makeEditCaseAnalysisUseCase() {
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const aiSessionRepository = new PrismaAiSessionRepository();
	const leadsRepository = new PrismaLeadsRepository();
	const editCaseAnalysisUseCase = new EditCaseAnalysisUseCase(
		caseAnalysisRepository,
		aiSessionRepository,
		leadsRepository
	);

	return editCaseAnalysisUseCase;
}

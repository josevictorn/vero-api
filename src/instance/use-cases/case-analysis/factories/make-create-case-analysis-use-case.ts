import { PrismaAiSessionRepository } from "@/core/repositories/prisma/prisma-ai-session-repository";
import { PrismaCaseAnalysisRepository } from "@/repositories/prisma/prisma-case-analysis-repository";
import { CreateCaseAnalysisUseCase } from "../create-case-analysis";

export function makeCreateCaseAnalysisUseCase() {
	const aiSessionRepository = new PrismaAiSessionRepository();
	const caseAnalysisRepository = new PrismaCaseAnalysisRepository();
	const createCaseAnalysisUseCase = new CreateCaseAnalysisUseCase(
		aiSessionRepository,
		caseAnalysisRepository
	);

	return createCaseAnalysisUseCase;
}

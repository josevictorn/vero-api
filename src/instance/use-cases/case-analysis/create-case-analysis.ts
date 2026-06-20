import { Either, left, right } from "@/utils/either";
import { CaseAnalysis } from "@generated/prisma/client";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";
import { AiSessionRepository } from "@/core/repositories/ai-session-repository";
import { CaseAnalysisRepository } from "@/instance/repositories/case-analysis-repository";

interface CreateCaseAnalysisUseCaseRequest {
    aiSessionId: string;
    leadId: string;
    title: string;
    viabilityLabel: string;
    analysisText: string;
    estimatedComplexity: string;
    mainLegalBase: string;
}

type CreateCaseAnalysisUseCaseResponse = Either<
    AiSessionNotFoundError,
    { caseAnalysis: CaseAnalysis }
>;

export class CreateCaseAnalysisUseCase {
    constructor(
        private readonly aiSessionRepository: AiSessionRepository,
        private readonly caseAnalysisRepository: CaseAnalysisRepository
    ) {}

    async execute({
        aiSessionId,
        leadId,
        title,
        viabilityLabel,
        analysisText,
        estimatedComplexity,
        mainLegalBase
    }: CreateCaseAnalysisUseCaseRequest): Promise<CreateCaseAnalysisUseCaseResponse> {
        if (aiSessionId){
            const aiSession = 
                await this.aiSessionRepository.findById(aiSessionId);

            if (!aiSession){
                return left(new AiSessionNotFoundError(aiSessionId));
            }
        }

        const caseAnalysis = await this.caseAnalysisRepository.create({
            aiSessionId,
            leadId,
            title,
            viabilityLabel,
            analysisText,
            estimatedComplexity,
            mainLegalBase,
        })

        return right({
            caseAnalysis
        });

    }
}

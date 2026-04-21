import { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { Either, left, right } from "@/utils/either";
import { CaseAnalysis } from "@generated/prisma/browser";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";
import { AiSessionNotFoundError } from "../ai-session/errors/ai-session-not-found-error";
import { LeadNotFoundError } from "../leads/errors/lead-not-found-error";
import { LeadsRepository } from "@/repositories/leads-repository";
import { AiSessionRepository } from "@/repositories/ai-session-repository";


interface EditCaseAnalysisUseCaseRequest {
    caseAnalysisId: string;
    title?: string;
    viabilityLabel?: string;
    analysisText?: string;
    estimatedComplexity?: string;
    mainLegalBase?: string;
    aiSessionId?: string;
    leadId?: string;
}

type EditCaseAnalysisUseCaseResponse = Either<
    CaseAnalysisNotFoundError | AiSessionNotFoundError | LeadNotFoundError,
    { caseAnalysis: CaseAnalysis }
>;

export class EditCaseAnalysisUseCase {
    constructor(
        private readonly caseAnalysisRepository: CaseAnalysisRepository,
        private readonly aiSessionRepository: AiSessionRepository,
        private readonly leadsRepository: LeadsRepository
    ) {}

    async execute({
        caseAnalysisId,
        title,
        viabilityLabel,
        analysisText,
        estimatedComplexity,
        mainLegalBase,
        aiSessionId,
        leadId,
    }: EditCaseAnalysisUseCaseRequest): Promise<EditCaseAnalysisUseCaseResponse> {
        const caseAnalysis = await this.caseAnalysisRepository.findById(caseAnalysisId);

        if (!caseAnalysis) {
            return left(new CaseAnalysisNotFoundError(caseAnalysisId));
        }

        if (aiSessionId) {
            const aiSession = await this.aiSessionRepository.findById(aiSessionId);

            if (!aiSession) {
                return left(new AiSessionNotFoundError(aiSessionId));
            }
        }

        if (leadId) {
            const lead = await this.leadsRepository.findById(leadId);

            if (!lead) {
                return left(new LeadNotFoundError(leadId));
            }
        }

        caseAnalysis.title = title ?? caseAnalysis.title;
        caseAnalysis.viabilityLabel = viabilityLabel ?? caseAnalysis.viabilityLabel;
        caseAnalysis.analysisText = analysisText ?? caseAnalysis.analysisText;
        caseAnalysis.estimatedComplexity = estimatedComplexity ?? caseAnalysis.estimatedComplexity;
        caseAnalysis.mainLegalBase = mainLegalBase ?? caseAnalysis.mainLegalBase;
        caseAnalysis.aiSessionId = aiSessionId ?? caseAnalysis.aiSessionId;
        caseAnalysis.leadId = leadId ?? caseAnalysis.leadId;

        await this.caseAnalysisRepository.save(caseAnalysis);

        return right({ caseAnalysis });
    }
}
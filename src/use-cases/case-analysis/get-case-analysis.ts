import { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { Either, left, right } from "@/utils/either";
import { CaseAnalysis } from "@generated/prisma/browser";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";


interface GetCaseAnalysisUseCaseRequest {
    caseAnalysisId: string;
}

type GetCaseAnalysisUseCaseResponse = Either<CaseAnalysisNotFoundError, { caseAnalysis: CaseAnalysis }>;

export class GetCaseAnalysisUseCase {
    constructor(
        private readonly caseAnalysisRepository: CaseAnalysisRepository
    ) {}

    async execute({
        caseAnalysisId,
    }: GetCaseAnalysisUseCaseRequest): Promise<GetCaseAnalysisUseCaseResponse> {
        const caseAnalysis = await this.caseAnalysisRepository.findById(caseAnalysisId);

        if (!caseAnalysis) {
            return left(new CaseAnalysisNotFoundError(caseAnalysisId));
        }

        return right({ caseAnalysis });
    }
}
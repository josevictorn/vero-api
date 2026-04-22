import { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { Either, left, right } from "@/utils/either";
import { CaseAnalysisNotFoundError } from "./errors/case-analysis-not-found-error";


interface DeleteCaseAnalysisUseCaseRequest {
    caseAnalysisId: string;
}

type DeleteCaseAnalysisUseCaseResponse = Either<CaseAnalysisNotFoundError, null>;

export class DeleteCaseAnalysisUseCase {
    constructor(
        private readonly caseAnalysisRepository: CaseAnalysisRepository
    ) {}

    async execute({
        caseAnalysisId,
    }: DeleteCaseAnalysisUseCaseRequest): Promise<DeleteCaseAnalysisUseCaseResponse> {
        const caseAnalysis = await this.caseAnalysisRepository.findById(caseAnalysisId);

        if (!caseAnalysis) {
            return left(new CaseAnalysisNotFoundError(caseAnalysisId));
        }

        await this.caseAnalysisRepository.delete(caseAnalysisId);

        return right(null);
    }
}
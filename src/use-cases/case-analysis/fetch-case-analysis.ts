import { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";
import { CaseAnalysis } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";

interface FetchCaseAnalysisUseCaseRequest {
    page: number;
}

type FetchCaseAnalysisUseCaseResponse = Either<
    InvalidPageError,
    {
        results: CaseAnalysis[];
        meta: {
            currentPage: number;
            totalCount: number;
            perPage: number;
        };
    }
>;

export class FetchCaseAnalysisUseCase {
    constructor(
        private readonly caseAnalysisRepository: CaseAnalysisRepository
    ) {}

    async execute({
        page,
    } : FetchCaseAnalysisUseCaseRequest): Promise<FetchCaseAnalysisUseCaseResponse> {
        if (page < 1) {
            return left(new InvalidPageError());
        }

        const caseAnalysis = await this.caseAnalysisRepository.findMany({ page });

        return right({
            results: caseAnalysis.items,
            meta: {
                currentPage: page,
                totalCount: caseAnalysis.total,
                perPage: ITEM_PER_PAGE,
            },
        });
    }
}
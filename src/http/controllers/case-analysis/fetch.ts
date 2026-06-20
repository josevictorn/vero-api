import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { InvalidPageError } from "@/instance/use-cases/case-analysis/errors/invalid-page-error";
import { makeFetchCaseAnalysisUseCase } from "@/instance/use-cases/case-analysis/factories/make-fetch-case-analysis-use-case";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";


export const FetchCaseAnalysisController: FastifyPluginAsyncZod = async (app) => {
    app.get(
        "/case-analysis",
        {
            onRequest: [verifyJWT],
            schema: {
                tags: ["case-analysis"],
                summary: "Fetch paginated list of case analyses",
                querystring: z.object({
                    page: z.coerce
                        .number()
                        .int()
                        .positive()
                        .default(1)
                        .describe("Page number"),
                }),
                response: {
                    200: z.object({
                        results: z.array(
                            z.object({
                                id: z.uuid(),
                                aiSessionId: z.uuid(),
                                leadId: z.uuid(),
                                title: z.string(),
                                viabilityLabel: z.string(),
                                analysisText: z.string(),
                                estimatedComplexity: z.string(),
                                mainLegalBase: z.string(),
                            })
                        ),
                        meta: z.object({
                            currentPage: z.number().int().positive(),
                            totalCount: z.number().int().nonnegative(),
                            perPage: z.number().int().positive(),
                        }),
                    }),
                    400: z.object({ message: z.string() }).describe("Invalid request."),
                    500: z
                        .object({ message: z.string() })
                        .describe("Internal server error."),
                },
            },
        },
        async (request, reply) => {
            const { page } = request.query;
            const fetchCaseAnalysisUseCase = makeFetchCaseAnalysisUseCase();

            const result = await fetchCaseAnalysisUseCase.execute({ page });

            if (result.isLeft()) {
                const error = result.value;

                switch (error.constructor) {
                    case InvalidPageError:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: error.message,
                        });
                    default:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: "An unexpected error occurred.",
                        });
                }
            }
            
            const { results, meta } = result.value;

            return reply.status(HTTP_STATUS.OK).send({
                results: results.map((caseAnalysis) => ({
                    id: caseAnalysis.id,
                    aiSessionId: caseAnalysis.aiSessionId,
                    leadId: caseAnalysis.leadId,
                    title: caseAnalysis.title,
                    viabilityLabel: caseAnalysis.viabilityLabel,
                    analysisText: caseAnalysis.analysisText,
                    estimatedComplexity: caseAnalysis.estimatedComplexity,
                    mainLegalBase: caseAnalysis.mainLegalBase,
                })),
                meta,
            });
        }
    )
}
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CaseAnalysisNotFoundError } from "@/use-cases/case-analysis/errors/case-analysis-not-found-error";
import { makeGetCaseAnalysisUseCase } from "@/use-cases/case-analysis/factories/make-get-case-analysis-use-case";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";


export const GetCaseAnalysisController: FastifyPluginAsyncZod = async (app) => {
    app.get("/case-analysis/:id", {
        onRequest: [verifyJWT],
        schema: {
            tags: ["case-analysis"],
            summary: "Get a case analysis by ID",
            params: z.object({
                id: z.uuid().describe("Case analysis ID"),
            }),
            response: {
                200: z.object({
                    caseAnalysis: z.object({
                        id: z.uuid(),
                        aiSessionId: z.uuid(),
                        leadId: z.uuid(),
                        title: z.string(),
                        viabilityLabel: z.string(),
                        analysisText: z.string(),
                        estimatedComplexity: z.string(),
                        mainLegalBase: z.string(),
                    }),
                }),
                400: z.object({ message: z.string() }).describe("Invalid request."),
                404: z.object({ message: z.string() }).describe("Case analysis not found."),
                500: z
                    .object({ message: z.string() })
                    .describe("Internal server error."),
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const getCaseAnalysisUseCase = makeGetCaseAnalysisUseCase();
        const result = await getCaseAnalysisUseCase.execute({ caseAnalysisId: id });
        if (result.isLeft()) {
            const error = result.value;
            switch (error.constructor) {
                case CaseAnalysisNotFoundError:
                    return reply.status(HTTP_STATUS.NOT_FOUND).send({
                        message: error.message,
                    });
                default:
                    return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                        message: "An unexpected error occurred.",
                    });
            }
        }
        const { caseAnalysis } = result.value;
        return reply.status(HTTP_STATUS.OK).send({
            caseAnalysis: {
                id: caseAnalysis.id,
                aiSessionId: caseAnalysis.aiSessionId,
                leadId: caseAnalysis.leadId,
                title: caseAnalysis.title,
                viabilityLabel: caseAnalysis.viabilityLabel,
                analysisText: caseAnalysis.analysisText,
                estimatedComplexity: caseAnalysis.estimatedComplexity,
                mainLegalBase: caseAnalysis.mainLegalBase,
            },
        });
    })
}
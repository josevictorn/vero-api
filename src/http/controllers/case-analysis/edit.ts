import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CaseAnalysisNotFoundError } from "@/instance/use-cases/case-analysis/errors/case-analysis-not-found-error";
import { makeEditCaseAnalysisUseCase } from "@/instance/use-cases/case-analysis/factories/make-edit-case-analysis-use-case";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";


export const EditCaseAnalysisController: FastifyPluginAsyncZod = async (app) => {
    app.put(
        "/case-analysis/:id",
        {
            onRequest: [verifyJWT],
            schema: {
                tags: ["case-analysis"],
                summary: "Edit a case analysis",
                params: z.object({
                    id: z.uuid(),
                }),
                body: z.object({
                    aiSessionId: z.uuid(),
                    leadId: z.uuid(),
                    title: z.string(),
                    viabilityLabel: z.string(),
                    analysisText: z.string(),
                    estimatedComplexity: z.string(),
                    mainLegalBase: z.string(),
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
                    404: z.object({
                        message: z.string()
                    }).describe("Case analysis not found."),
                    500: z.object({
                        message: z.string()
                    }).describe("Internal server error."),
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const { aiSessionId, leadId, title, viabilityLabel, analysisText, estimatedComplexity, mainLegalBase } = request.body;
            const editCaseAnalysisUseCase = makeEditCaseAnalysisUseCase();
            const result = await editCaseAnalysisUseCase.execute({
                caseAnalysisId: id,
                aiSessionId,
                leadId,
                title,
                viabilityLabel,
                analysisText,
                estimatedComplexity,
                mainLegalBase,
            });
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
            return reply.status(HTTP_STATUS.OK).send({
                caseAnalysis: result.value.caseAnalysis,
            });
        }
    )
}
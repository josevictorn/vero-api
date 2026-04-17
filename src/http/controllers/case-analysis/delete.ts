import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CaseAnalysisNotFoundError } from "@/use-cases/case-analysis/errors/case-analysis-not-found-error";
import { makeDeleteCaseAnalysisUseCase } from "@/use-cases/case-analysis/factories/make-delete-case-analysis-use-case";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";


export const DeleteCaseAnalysisController: FastifyPluginAsyncZod = async (app) => {
    app.delete(
        "/case-analysis/:id",
        {
            onRequest: [verifyJWT],
            schema: {
                tags: ["case-analysis"],
                summary: "Delete a case analysis",
                params: z.object({
                    id: z.uuid(),
                }),
                response: {
                    204: z.null(),
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
            const deleteCaseAnalysisUseCase = makeDeleteCaseAnalysisUseCase();
            const result = await deleteCaseAnalysisUseCase.execute({ caseAnalysisId: id });
            if (result.isLeft()) {
                const error = result.value;

                switch (error.constructor) {
                    case CaseAnalysisNotFoundError:
                        return reply.status(HTTP_STATUS.NOT_FOUND).send({
                            message: error.message,
                        });
                    default:
                        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
                            message: "An unexpected error occurred.",
                        });
                }
            }
            return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
        }
    )
}

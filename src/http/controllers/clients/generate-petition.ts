import { LawyerNotFoundError } from "@/core/use-cases/leads/errors/lawyer-not-found-error";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CaseAnalysisNotFoundError } from "@/instance/use-cases/case-analysis/errors/case-analysis-not-found-error";
import { ClientNotFoundError } from "@/instance/use-cases/clients/errors/client-not-found-error";
import { GoogleDocsIntegrationError } from "@/instance/use-cases/clients/errors/google-docs-integration-error";
import { makeGeneratePetitionUseCase } from "@/instance/use-cases/clients/factories/make-generate-petition";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const GeneratePetitionController: FastifyPluginAsyncZod = async (app) => { 
    app.post(
        "/clients/:id/petition",
        {
            onRequest: [verifyJWT],
            schema: {
				tags: ["clients"],
				summary: "Generate a petition for a client",
				params: z.object({
					id: z.uuid(),
				}),
                body: z.object({
                    caseAnalysisId: z.uuid(),
                }),
				response: {
					200: z.object({
						petitionUrl: z.string().url(),
					}),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
					500: z.object({ message: z.string() }),
				},
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const { caseAnalysisId } = request.body;
            const generatePetitionUseCase = makeGeneratePetitionUseCase()

            const result = await generatePetitionUseCase.execute({
                clientId: id,
                userId: request.user.sub,
                caseAnalysisId,
            });

            if (result.isLeft()) {
                const error = result.value;

                switch (error.constructor) {
                    case ClientNotFoundError:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: error.message,
                    });
                    case LawyerNotFoundError:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: error.message,
                    });
                    case GoogleDocsIntegrationError:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: error.message,
                    });
                    case CaseAnalysisNotFoundError:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: error.message,
                    });
                    default:
                        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
                            message: "An unexpected error occurred.",
                    });
                }
            }

            return reply.status(HTTP_STATUS.OK).send({
                petitionUrl: result.value.petitionUrl,
            })
        }
    )
}

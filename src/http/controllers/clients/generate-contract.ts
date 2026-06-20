import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeGenerateContractUseCase } from "@/instance/use-cases/clients/factories/make-generate-contract-use-case";
import { ClientNotFoundError } from "@/instance/use-cases/clients/errors/client-not-found-error";
import { LawyerNotFoundError } from "@/core/use-cases/leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "@/core/use-cases/leads/errors/workspace-not-found-error";
import { GoogleDocsIntegrationError } from "@/instance/use-cases/clients/errors/google-docs-integration-error";

export const GenerateContractController: FastifyPluginAsyncZod = async (
	app
) => {
	app.post(
		"/clients/:id/contract",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Generate a contract for a client",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						contractUrl: z.string().url(),
					}),
					400: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
					500: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const generateContractUseCase = makeGenerateContractUseCase();

			const result = await generateContractUseCase.execute({
				clientId: id,
				userId: request.user.sub,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case ClientNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case LawyerNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case GoogleDocsIntegrationError:
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
				contractUrl: result.value.contractUrl,
			});
		}
	);
};

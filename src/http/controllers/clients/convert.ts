import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LeadNotFoundError } from "@/use-cases/leads/errors/lead-not-found-error";
import { LeadAlreadyConvertedError } from "@/use-cases/clients/errors/lead-already-converted-error";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
import { HTTP_STATUS } from "@/utils/constants";
import {makeConvertLeadToClientUseCase} from "@/use-cases/clients/factories/make-convert-lead-to-client-use-case";

export const ConvertLeadToClientController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/leads/:leadId/convert",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Convert a lead into a client",
				params: z.object({
					leadId: z.uuid(),
				}),
				response: {
					201: z.object({
						clientId: z.uuid(),
					}),
					400: z.object({
						message: z.string(),
					}),
					403: z.object({
						message: z.string(),
					}),
					404: z.object({
						message: z.string(),
					}),
					409: z.object({
						message: z.string(),
					}),
					500: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { leadId } = request.params;

			//const workspaceId = request.user.workspaceId;

			const convertLeadToClientUseCase = makeConvertLeadToClientUseCase();

			const result = await convertLeadToClientUseCase.execute({
				leadId,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case LeadNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});

					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});

					case LeadAlreadyConvertedError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});

					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				clientId: result.value.client.id,
			});
		}
	);
};

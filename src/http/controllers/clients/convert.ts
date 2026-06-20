import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeConvertLeadToClientUseCase } from "@/instance/use-cases/clients/factories/make-convert-lead-to-client-use-case";
import { LeadNotFoundError } from "@/core/use-cases/leads/errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "@/core/use-cases/leads/errors/workspace-not-found-error";
import { LeadAlreadyConvertedError } from "@/instance/use-cases/clients/errors/lead-already-converted-error";

export const ConvertLeadToClientController: FastifyPluginAsyncZod = async (
	app
) => {
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
				body: z.object({
					maritalStatus: z.string(),
					profession: z.string(),
					rg: z.string(),
					issuingAgency: z.string(),
					cpf: z.string(),
					street: z.string(),
					neighborhood: z.string(),
					city: z.string(),
					state: z.string(),
					zipCode: z.string(),
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
			const {
				maritalStatus,
				profession,
				rg,
				issuingAgency,
				cpf,
				street,
				neighborhood,
				city,
				state,
				zipCode,
			} = request.body;

			const convertLeadToClientUseCase = makeConvertLeadToClientUseCase();

			const result = await convertLeadToClientUseCase.execute({
				leadId,
				maritalStatus,
				profession,
				rg,
				issuingAgency,
				cpf,
				street,
				neighborhood,
				city,
				state,
				zipCode,
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

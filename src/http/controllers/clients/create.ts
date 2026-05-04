import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { makeCreateClientUseCase } from "@/use-cases/clients/factories/make-create-client-use-case";
import { LawyerNotFoundError } from "@/use-cases/leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
import { HTTP_STATUS } from "@/utils/constants";

const CLIENT_NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const CreateClientController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/clients",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Create a new client",
				body: z.object({
					workspaceId: z.uuid(),
					lawyerId: z.uuid().optional(),
					name: z.string().min(CLIENT_NAME_MIN_LENGTH),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH),
					email: z.email(),
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
					201: z.object({ clientId: z.uuid() }),
					400: z.object({
						message: z.string(),
						issues: z.array(z.object({ message: z.string() })).optional(),
					}),
					404: z.object({ message: z.string() }),
					500: z.object({ message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const {
				workspaceId,
				lawyerId,
				name,
				cellphone,
				email,
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

			const createClientUseCase = makeCreateClientUseCase();

			const result = await createClientUseCase.execute({
				workspaceId,
				lawyerId,
				name,
				cellphone,
				email,
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
					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});

					case LawyerNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
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

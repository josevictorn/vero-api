import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { ClientNotFoundError } from "@/use-cases/clients/errors/client-not-found-error";
import { makeGetClientUseCase } from "@/use-cases/clients/factories/make-get-client-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetClientController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/clients/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Get a client by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						id: z.uuid(),
						name: z.string(),
						email: z.string(),
						cellphone: z.string(),
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
						workspaceId: z.uuid(),
						lawyerId: z.uuid().nullable(),
						createdAt: z.date(),
						updatedAt: z.date(),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string().describe("Client not found.") }),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const getClientUseCase = makeGetClientUseCase();

			const result = await getClientUseCase.execute({ clientId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case ClientNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { client } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: client.id,
				name: client.name,
				email: client.email,
				cellphone: client.cellphone,
				workspaceId: client.workspaceId,
				lawyerId: client.lawyerId,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
				maritalStatus: client.maritalStatus,
				profession: client.profession,
				rg: client.rg,
				issuingAgency: client.issuingAgency,
				cpf: client.cpf,
				street: client.street,
				neighborhood: client.neighborhood,
				city: client.city,
				state: client.state,
				zipCode: client.zipCode,
			});
		}
	);
};

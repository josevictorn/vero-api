import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { ClientNotFoundError } from "@/use-cases/clients/errors/client-not-found-error";
import { makeEditClientUseCase } from "@/use-cases/clients/factories/make-edit-client-use-case";
import { LawyerNotFoundError } from "@/use-cases/leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
import { HTTP_STATUS } from "@/utils/constants";

const client_NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const EditClientController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/clients/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Edit an existing client",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					workspaceId: z.uuid().optional(),
					lawyerId: z.uuid().nullable().optional(),
					name: z.string().min(client_NAME_MIN_LENGTH).optional(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH).optional(),
					email: z.email().optional(),
					maritalStatus: z.string().optional(),
					profession: z.string().optional(),
					rg: z.string().optional(),
					issuingAgency: z.string().optional(),
					cpf: z.string().optional(),
					street: z.string().optional(),
					neighborhood: z.string().optional(),
					city: z.string().optional(),
					state: z.string().optional(),
					zipCode: z.string().optional(),
				}),
				response: {
					200: z.object({
						client: z.object({
							id: z.uuid(),
							workspace_id: z.uuid(),
							lawyer_id: z.uuid().nullable(),
							name: z.string(),
							cellphone: z.string(),
							email: z.email(),
							marital_status: z.string(),
							profession: z.string(),
							rg: z.string(),
							issuing_agency: z.string(),
							cpf: z.string(),
							street: z.string(),
							neighborhood: z.string(),
							city: z.string(),
							state: z.string(),
							zip_code: z.string(),
							created_at: z.date(),
						}),
					}),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("client, workspace or lawyer not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
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
			const editclientUseCase = makeEditClientUseCase();

			const result = await editclientUseCase.execute({
				clientId: id,
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
					case ClientNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
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

			const { client } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				client: {
					id: client.id,
					workspace_id: client.workspaceId,
					lawyer_id: client.lawyerId,
					name: client.name,
					cellphone: client.cellphone,
					email: client.email,
					marital_status: client.maritalStatus,
					profession: client.profession,
					rg: client.rg,
					issuing_agency: client.issuingAgency,
					cpf: client.cpf,
					street: client.street,
					neighborhood: client.neighborhood,
					city: client.city,
					state: client.state,
					zip_code: client.zipCode,
					created_at: client.createdAt,
				},
			});
		}
	);
};

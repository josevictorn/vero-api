import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LawyerNotFoundError } from "@/use-cases/leads/errors/lawyer-not-found-error";
import { LeadNotFoundError } from "@/use-cases/leads/errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/leads/errors/workspace-not-found-error";
import { makeEditLeadUseCase } from "@/use-cases/leads/factories/make-edit-lead-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const LEAD_NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const EditLeadController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/leads/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["leads"],
				summary: "Edit an existing lead",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					workspaceId: z.uuid().optional(),
					lawyerId: z.uuid().nullable().optional(),
					name: z.string().min(LEAD_NAME_MIN_LENGTH).optional(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH).optional(),
					email: z.string().email().optional().nullable(),
					status: z.enum(["NEW_LEAD", "INTERVIEWING", "FORWARDED", "COMPLETED"]).optional(),
				}),
				response: {
					200: z.object({
						lead: z.object({
							id: z.uuid(),
							workspace_id: z.uuid(),
							lawyer_id: z.uuid().nullable(),
							name: z.string(),
							cellphone: z.string(),
							email: z.string().email().nullable(),
							status: z.enum(["NEW_LEAD", "INTERVIEWING", "FORWARDED", "COMPLETED"]),
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
						.describe("Lead, workspace or lawyer not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { workspaceId, lawyerId, name, cellphone, email, status } = request.body;
			const editLeadUseCase = makeEditLeadUseCase();

			const result = await editLeadUseCase.execute({
				leadId: id,
				workspaceId,
				lawyerId,
				name,
				cellphone,
				email,
				status,
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

			const { lead } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				lead: {
					id: lead.id,
					workspace_id: lead.workspaceId,
					lawyer_id: lead.lawyerId,
					name: lead.name,
					cellphone: lead.cellphone,
					email: lead.email,
					status: lead.status,
					created_at: lead.createdAt,
				},
			});
		}
	);
};

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeGetLeadUseCase } from "@/core/use-cases/leads/factories/make-get-lead-use-case";
import { LeadNotFoundError } from "@/core/use-cases/leads/errors/lead-not-found-error";

export const GetLeadsController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/leads/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["leads"],
				summary: "Get a lead by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						id: z.uuid(),
						workspace_id: z.uuid(),
						lawyer_id: z.uuid().nullable(),
						name: z.string(),
						cellphone: z.string(),
						email: z.string().email().nullable(),
						status: z.enum(["NEW_LEAD", "INTERVIEWING", "FORWARDED", "COMPLETED"]),
						created_at: z.date(),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("Lead not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const getLeadUseCase = makeGetLeadUseCase();

			const result = await getLeadUseCase.execute({ leadId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case LeadNotFoundError:
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
				id: lead.id,
				workspace_id: lead.workspaceId,
				lawyer_id: lead.lawyerId,
				name: lead.name,
				cellphone: lead.cellphone,
				email: lead.email,
				status: lead.status,
				created_at: lead.createdAt,
			});
		}
	);
};

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LeadNotFoundError } from "@/use-cases/leads/errors/lead-not-found-error";
import { makeDeleteLeadUseCase } from "@/use-cases/leads/factories/make-delete-lead-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteLeadController: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/leads/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["leads"],
				summary: "Delete an existing lead",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("Lead deleted"),
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
			const deleteLeadUseCase = makeDeleteLeadUseCase();

			const result = await deleteLeadUseCase.execute({ leadId: id });

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

			return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
		}
	);
};

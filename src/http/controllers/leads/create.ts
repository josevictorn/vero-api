import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LawyerNotFoundError } from "@/use-cases/leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/leads/errors/workspace-not-found-error";
import { makeCreateLeadUseCase } from "@/use-cases/leads/factories/make-create-lead-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const LEAD_NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const CreateLeadController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/leads",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["leads"],
				summary: "Create a new lead",
				body: z.object({
					workspaceId: z.uuid(),
					lawyerId: z.uuid().optional(),
					name: z.string().min(LEAD_NAME_MIN_LENGTH),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH),
					email: z.email(),
				}),
				response: {
					201: z.object({ leadId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("Workspace or lawyer not found."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { workspaceId, lawyerId, name, cellphone, email } = request.body;
			const createLeadUseCase = makeCreateLeadUseCase();

			const result = await createLeadUseCase.execute({
				workspaceId,
				lawyerId,
				name,
				cellphone,
				email,
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
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				leadId: result.value.lead.id,
			});
		}
	);
};

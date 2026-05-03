import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LawyerNotFoundError } from "@/use-cases/lawyers/errors/lawyer-not-found-error";
import { UserNotFoundError } from "@/use-cases/lawyers/errors/user-not-found-error";
import { makeGetLawyerUseCase } from "@/use-cases/lawyers/factories/make-get-lawyer-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetLawyerController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/lawyers/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["lawyers"],
				summary: "Get a lawyer by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						id: z.uuid(),
						user_id: z.uuid(),
						workspace_id: z.uuid(),
						cellphone: z.string(),
						name: z.string(),
						email: z.email(),
						oab: z.string(),
						oab_state: z.string(),
						pix: z.string(),
						created_at: z.date(),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("Lawyer not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const getLawyerUseCase = makeGetLawyerUseCase();

			const result = await getLawyerUseCase.execute({ lawyerId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case LawyerNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case UserNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { lawyer, user } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: lawyer.id,
				user_id: lawyer.userId,
				workspace_id: lawyer.workspaceId,
				cellphone: lawyer.cellphone,
				name: user.name,
				email: user.email,
				oab: lawyer.oab,
				oab_state: lawyer.oabState,
				pix: lawyer.pix,
				created_at: lawyer.createdAt,
			});
		}
	);
};

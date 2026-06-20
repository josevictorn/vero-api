import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeDeleteAiSessionUseCase } from "@/core/use-cases/ai-session/factories/make-delete-ai-session-use-case";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";

export const DeleteAiSessionController: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/ai-sessions/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["ai-sessions"],
				summary: "Delete an existing AI session",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("AI session deleted"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("AI session not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const deleteAiSessionUseCase = makeDeleteAiSessionUseCase();

			const result = await deleteAiSessionUseCase.execute({ aiSessionId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case AiSessionNotFoundError:
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

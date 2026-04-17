import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { AiSessionNotFoundError } from "@/use-cases/ai-session/errors/ai-session-not-found-error";
import { makeGetAiSessionUseCase } from "@/use-cases/ai-session/factories/make-get-ai-session-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetAiSessionController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/ai-sessions/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["ai-sessions"],
				summary: "Get an AI session by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						id: z.uuid(),
						screening_flow_id: z.uuid().nullable(),
						chat_id: z.string(),
						status: z.string(),
						chat_state: z.any(),
						name: z.string(),
						cellphone: z.string(),
						is_third_party: z.boolean(),
						created_at: z.date(),
					}),
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
			const getAiSessionUseCase = makeGetAiSessionUseCase();

			const result = await getAiSessionUseCase.execute({ aiSessionId: id });

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

			const { aiSession } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: aiSession.id,
				screening_flow_id: aiSession.screeningFlowId,
				chat_id: aiSession.chatId,
				status: aiSession.status,
				chat_state: aiSession.chatState as Record<string, unknown>,
				name: aiSession.name,
				cellphone: aiSession.cellphone,
				is_third_party: aiSession.isThirdParty,
				created_at: aiSession.createdAt,
			});
		}
	);
};

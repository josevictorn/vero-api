import type { Prisma } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { AiSessionNotFoundError } from "@/use-cases/ai-session/errors/ai-session-not-found-error";
import { ScreeningFlowNotFoundError } from "@/use-cases/ai-session/errors/screening-flow-not-found-error";
import { makeEditAiSessionUseCase } from "@/use-cases/ai-session/factories/make-edit-ai-session-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const EditAiSessionController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/ai-sessions/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["ai-sessions"],
				summary: "Edit an existing AI session",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					screeningFlowId: z.uuid().nullable().optional(),
					chatId: z.string().min(1).optional(),
					status: z.string().min(1).optional(),
					chatState: z.any().optional(),
					name: z.string().min(NAME_MIN_LENGTH).optional(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH).optional(),
					isThirdParty: z.boolean().optional(),
				}),
				response: {
					200: z.object({
						aiSession: z.object({
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
					}),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("AI session or screening flow not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const {
				screeningFlowId,
				chatId,
				status,
				chatState,
				name,
				cellphone,
				isThirdParty,
			} = request.body;
			const editAiSessionUseCase = makeEditAiSessionUseCase();

			const result = await editAiSessionUseCase.execute({
				aiSessionId: id,
				screeningFlowId,
				chatId,
				status,
				chatState: chatState as Prisma.InputJsonValue,
				name,
				cellphone,
				isThirdParty,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case AiSessionNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case ScreeningFlowNotFoundError:
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
				aiSession: {
					id: aiSession.id,
					screening_flow_id: aiSession.screeningFlowId,
					chat_id: aiSession.chatId,
					status: aiSession.status,
					chat_state: aiSession.chatState as Record<string, unknown>,
					name: aiSession.name,
					cellphone: aiSession.cellphone,
					is_third_party: aiSession.isThirdParty,
					created_at: aiSession.createdAt,
				},
			});
		}
	);
};

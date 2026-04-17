import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { InvalidPageError } from "@/use-cases/ai-session/errors/invalid-page-error";
import { makeFetchAiSessionsUseCase } from "@/use-cases/ai-session/factories/make-fetch-ai-sessions-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const FetchAiSessionsController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/ai-sessions",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["ai-sessions"],
				summary: "Fetch paginated list of AI sessions",
				querystring: z.object({
					page: z.coerce
						.number()
						.int()
						.positive()
						.default(1)
						.describe("Page number"),
				}),
				response: {
					200: z.object({
						results: z.array(
							z.object({
								id: z.uuid(),
								screening_flow_id: z.uuid().nullable(),
								chat_id: z.string(),
								status: z.string(),
								chat_state: z.any(),
								name: z.string(),
								cellphone: z.string(),
								is_third_party: z.boolean(),
								created_at: z.date(),
							})
						),
						meta: z.object({
							currentPage: z.number().int().positive(),
							totalCount: z.number().int().nonnegative(),
							perPage: z.number().int().positive(),
						}),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { page } = request.query;
			const fetchAiSessionsUseCase = makeFetchAiSessionsUseCase();

			const result = await fetchAiSessionsUseCase.execute({ page });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case InvalidPageError:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { results, meta } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				results: results.map((aiSession) => ({
					id: aiSession.id,
					screening_flow_id: aiSession.screeningFlowId,
					chat_id: aiSession.chatId,
					status: aiSession.status,
					chat_state: aiSession.chatState as Record<string, unknown>,
					name: aiSession.name,
					cellphone: aiSession.cellphone,
					is_third_party: aiSession.isThirdParty,
					created_at: aiSession.createdAt,
				})),
				meta,
			});
		}
	);
};

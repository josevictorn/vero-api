import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { InvalidPageError } from "@/use-cases/lawyers/errors/invalid-page-error";
import { UserNotFoundError } from "@/use-cases/lawyers/errors/user-not-found-error";
import { makeFetchLawyersUseCase } from "@/use-cases/lawyers/factories/make-fetch-lawyers-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const FetchLawyersController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/lawyers",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["lawyers"],
				summary: "Fetch paginated list of lawyers",
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
								user_id: z.uuid(),
								workspace_id: z.uuid(),
								cellphone: z.string(),
								name: z.string(),
								email: z.email(),
								oab: z.string(),
								oab_state: z.string(),
								pix: z.string(),
								created_at: z.date(),
							})
						),
						meta: z.object({
							currentPage: z.number().int().positive(),
							totalCount: z.number().int().nonnegative(),
							perPage: z.number().int().positive(),
						}),
					}),
					404: z.object({ message: z.string() }).describe("Lawyer not found"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { page } = request.query;
			const fetchLawyersUseCase = makeFetchLawyersUseCase();

			const result = await fetchLawyersUseCase.execute({ page });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case InvalidPageError:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
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

			const { results, meta } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				results: results.map(({ lawyer, user }) => ({
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
				})),
				meta,
			});
		}
	);
};

import { Role } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { InvalidPageError } from "@/use-cases/users/errors/invalid-page-error";
import { makeFetchUsersUseCase } from "@/use-cases/users/factories/make-fetch-users-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const FetchUsersController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/users",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["users"],
				summary: "Fetch paginated list of users",
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
								name: z.string(),
								email: z.email(),
								role: z.enum(Role),
								created_at: z.date(),
							})
						),
						meta: z.object({
							currentPage: z.number().int().positive(),
							totalCount: z.number().int().nonnegative(),
							perPage: z.number().int().positive(),
						}),
					}),
					400: z
						.object({
							message: z.string(),
						})
						.describe("Invalid request."),
					500: z
						.object({
							message: z.string(),
						})
						.describe("Internal server error"),
				},
			},
		},
		async (request, reply) => {
			const { page } = request.query;

			const fetchUsers = await makeFetchUsersUseCase();

			const result = await fetchUsers.execute({ page });

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
				results: results.map((user) => ({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					created_at: user.createdAt,
				})),
				meta,
			});
		}
	);
};

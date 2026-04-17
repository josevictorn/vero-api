import { Role } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { UserNotFoundError } from "@/use-cases/users/errors/user-not-found-error";
import { makeGetUserProfileUseCase } from "@/use-cases/users/factories/make-get-user-profile-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetUsersController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/users/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["users"],
				summary: "Fetch a user by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z
						.object({
							id: z.uuid(),
							name: z.string(),
							email: z.email(),
							role: z.enum(Role),
							created_at: z.date(),
						})
						.describe("User details"),
					400: z
						.object({
							message: z.string(),
						})
						.describe("Invalid request."),
					404: z
						.object({
							message: z.string(),
						})
						.describe("User not found"),
					500: z
						.object({
							message: z.string(),
						})
						.describe("Internal server error"),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const getUserUseCase = makeGetUserProfileUseCase();

			const result = await getUserUseCase.execute({ userId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
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

			const { user } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				created_at: user.createdAt,
			});
		}
	);
};

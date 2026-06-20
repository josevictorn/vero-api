import { Role } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeEditUserUseCase } from "@/core/use-cases/users/factories/make-edit-user-use-case";
import { UserNotFoundError } from "@/core/use-cases/users/errors/user-not-found-error";
import { EmailIsAlreadyInUseError } from "@/core/use-cases/users/errors/email-is-already-in-use-error";

export const EditUserController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/users/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["users"],
				summary: "Edit an existing user",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					name: z.string().min(3).optional(),
					email: z.email().optional(),
					role: z.enum(Role).optional(),
				}),
				response: {
					200: z
						.object({
							user: z.object({
								id: z.uuid(),
								name: z.string(),
								email: z.email(),
								role: z.enum(Role),
								created_at: z.date(),
							}),
						})
						.describe("Updated user profile"),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({
							message: z.string(),
						})
						.describe("User not found"),
					409: z
						.object({
							message: z.string(),
						})
						.describe("Email already in use"),
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
			const { name, email, role } = request.body;

			const editUserUseCase = makeEditUserUseCase();

			const result = await editUserUseCase.execute({
				userId: id,
				name,
				email,
				role,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case UserNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case EmailIsAlreadyInUseError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { user } = result.value;

			reply.status(HTTP_STATUS.OK).send({
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					created_at: user.createdAt,
				},
			});
		}
	);
};

import { Role } from "@generated/prisma/client";
import { makeAuthenticateUseCase } from "@usecases/users/factories/make-authenticate-use-case";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { InvalidCredentialsError } from "@/use-cases/users/errors/invalid-credentials-error";
import { HTTP_STATUS } from "@/utils/constants";

export const AuthenticateController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users/authenticate",
		{
			schema: {
				tags: ["users"],
				summary: "Authenticate a user and get an access token",
				body: z.object({
					email: z.email(),
					password: z.string().min(6),
				}),
				response: {
					200: z
						.object({
							access_token: z.string(),
							user: z.object({
								id: z.uuid(),
								name: z.string(),
								email: z.email(),
								role: z.enum(Role),
							}),
						})
						.describe("User authenticated successfully."),
					400: z
						.object({
							message: z.string(),
						})
						.describe("Invalid request."),
					401: z
						.object({
							message: z.string(),
						})
						.describe("Invalid credentials."),
					500: z
						.object({
							message: z.string(),
						})
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

			const authenticateUseCase = makeAuthenticateUseCase();

			const result = await authenticateUseCase.execute({
				email,
				password,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case InvalidCredentialsError:
						return reply.status(HTTP_STATUS.UNAUTHORIZED).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { user } = result.value;

			const token = await reply.jwtSign(
				{ role: user.role },
				{ sign: { sub: user.id } }
			);

			return reply.status(HTTP_STATUS.OK).send({
				access_token: token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		}
	);
};

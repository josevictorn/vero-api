import { UserAlreadyExistsError } from "@/core/use-cases/users/errors/user-already-exists-error";
import { makeRegisterUseCase } from "@/core/use-cases/users/factories/make-register-user-use-case";
import { Role } from "@generated/prisma/enums";
import { HTTP_STATUS } from "@utils/constants";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const RegisterUserController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users",
		{
			schema: {
				tags: ["users"],
				summary: "Create a new user",
				body: z.object({
					name: z.string().min(3),
					email: z.email(),
					password: z.string().min(6),
					role: z.enum(Role).optional(),
				}),
				response: {
					201: z
						.object({ userId: z.uuid() })
						.describe("Usuário criado com sucesso!"),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Requisição inválida."),
					409: z
						.object({ message: z.string() })
						.describe("Email já está em uso."),
					500: z
						.object({ message: z.string() })
						.describe("Erro interno do servidor."),
				},
			},
		},
		async (request, reply) => {
			const { name, email, password, role } = request.body;

			const registerUseCase = makeRegisterUseCase();

			const result = await registerUseCase.execute({
				name,
				email,
				password,
				role,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case UserAlreadyExistsError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				userId: result.value.user.id,
			});
		}
	);
};

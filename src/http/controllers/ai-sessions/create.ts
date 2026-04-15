import type { InputJsonValue } from "@generated/prisma/models";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { ScreeningFlowNotFoundError } from "@/use-cases/ai-session/errors/screening-flow-not-found-error";
import { makeCreateAiSessionUseCase } from "@/use-cases/ai-session/factories/make-create-ai-session-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const NAME_MIN_LENGTH = 3;
const CELLPHONE_MIN_LENGTH = 10;

export const CreateAiSessionController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/ai-sessions",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["ai-sessions"],
				summary: "Create a new AI session",
				body: z.object({
					screeningFlowId: z.uuid().optional(),
					chatId: z.string().min(1),
					status: z.string().min(1),
					chatState: z.any(),
					name: z.string().min(NAME_MIN_LENGTH),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH),
					isThirdParty: z.boolean().optional(),
				}),
				response: {
					201: z.object({ aiSessionId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("Screening flow not found."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const {
				screeningFlowId,
				chatId,
				status,
				chatState,
				name,
				cellphone,
				isThirdParty,
			} = request.body;
			const createAiSessionUseCase = makeCreateAiSessionUseCase();

			const result = await createAiSessionUseCase.execute({
				screeningFlowId,
				chatId,
				status,
				chatState: chatState as InputJsonValue,
				name,
				cellphone,
				isThirdParty,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
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

			return reply.status(HTTP_STATUS.CREATED).send({
				aiSessionId: result.value.aiSession.id,
			});
		}
	);
};

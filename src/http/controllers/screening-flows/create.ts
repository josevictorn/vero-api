import type { Prisma } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { makeCreateScreeningFlowUseCase } from "@/use-cases/screening-flows/factories/make-create-screening-flow-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const CASE_TYPE_MIN_LENGTH = 2;

export const CreateScreeningFlowController: FastifyPluginAsyncZod = async (
	app
) => {
	app.post(
		"/screening-flows",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-flows"],
				summary: "Create a new screening flow",
				body: z.object({
					caseType: z.string().min(CASE_TYPE_MIN_LENGTH),
					questions: z.any(),
				}),
				response: {
					201: z.object({ screeningFlowId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { caseType, questions } = request.body;
			const createScreeningFlowUseCase = makeCreateScreeningFlowUseCase();

			const result = await createScreeningFlowUseCase.execute({
				caseType,
				questions: questions as Prisma.InputJsonValue,
			});

			if (result.isLeft()) {
				return reply.status(HTTP_STATUS.BAD_REQUEST).send({
					message: "An unexpected error occurred.",
				});
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				screeningFlowId: result.value.screeningFlow.id,
			});
		}
	);
};

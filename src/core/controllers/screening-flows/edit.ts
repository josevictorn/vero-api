import type { Prisma } from "@generated/prisma/client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeEditScreeningFlowUseCase } from "@/core/use-cases/screening-flows/factories/make-edit-screening-flow-use-case";
import { ScreeningFlowNotFoundError } from "@/core/use-cases/screening-flows/errors/screening-flow-not-found-error";

const CASE_TYPE_MIN_LENGTH = 2;

export const EditScreeningFlowController: FastifyPluginAsyncZod = async (
	app
) => {
	app.patch(
		"/screening-flows/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-flows"],
				summary: "Edit an existing screening flow",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					caseType: z.string().min(CASE_TYPE_MIN_LENGTH).optional(),
					questions: z.any().optional(),
				}),
				response: {
					200: z.object({
						screeningFlow: z.object({
							id: z.uuid(),
							case_type: z.string(),
							questions: z.any(),
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
						.describe("Screening flow not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { caseType, questions } = request.body;
			const editScreeningFlowUseCase = makeEditScreeningFlowUseCase();

			const result = await editScreeningFlowUseCase.execute({
				screeningFlowId: id,
				caseType,
				questions: questions as Prisma.InputJsonValue | undefined,
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

			const { screeningFlow } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				screeningFlow: {
					id: screeningFlow.id,
					case_type: screeningFlow.caseType,
					questions: screeningFlow.questions,
					created_at: screeningFlow.createdAt,
				},
			});
		}
	);
};

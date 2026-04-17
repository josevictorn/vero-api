import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { ScreeningFlowNotFoundError } from "@/use-cases/screening-flows/errors/screening-flow-not-found-error";
import { makeGetScreeningFlowUseCase } from "@/use-cases/screening-flows/factories/make-get-screening-flow-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetScreeningFlowsController: FastifyPluginAsyncZod = async (
	app
) => {
	app.get(
		"/screening-flows/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-flows"],
				summary: "Get a screening flow by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z.object({
						id: z.uuid(),
						case_type: z.string(),
						questions: z.any(),
						created_at: z.date(),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
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
			const getScreeningFlowUseCase = makeGetScreeningFlowUseCase();

			const result = await getScreeningFlowUseCase.execute({
				screeningFlowId: id,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case ScreeningFlowNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { screeningFlow } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: screeningFlow.id,
				case_type: screeningFlow.caseType,
				questions: screeningFlow.questions,
				created_at: screeningFlow.createdAt,
			});
		}
	);
};

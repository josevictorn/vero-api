import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { ScreeningFlowNotFoundError } from "@/use-cases/screening-flows/errors/screening-flow-not-found-error";
import { makeDeleteScreeningFlowUseCase } from "@/use-cases/screening-flows/factories/make-delete-screening-flow-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteScreeningFlowController: FastifyPluginAsyncZod = async (
	app
) => {
	app.delete(
		"/screening-flows/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-flows"],
				summary: "Delete an existing screening flow",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("Screening flow deleted"),
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
			const deleteScreeningFlowUseCase = makeDeleteScreeningFlowUseCase();

			const result = await deleteScreeningFlowUseCase.execute({
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

			return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
		}
	);
};

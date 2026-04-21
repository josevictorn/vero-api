import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LawyerNotFoundError } from "@/use-cases/lawyers/errors/lawyer-not-found-error";
import { makeDeleteLawyerUseCase } from "@/use-cases/lawyers/factories/make-delete-lawyer-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteLawyerController: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/lawyers/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["lawyers"],
				summary: "Delete an existing lawyer",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("Lawyer deleted"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("Lawyer not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const deleteLawyerUseCase = makeDeleteLawyerUseCase();

			const result = await deleteLawyerUseCase.execute({ lawyerId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case LawyerNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
		}
	);
};

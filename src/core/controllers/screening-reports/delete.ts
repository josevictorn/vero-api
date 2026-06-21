import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeDeleteScreeningReportUseCase } from "@/core/use-cases/screening-report/factories/make-delete-screening-report-use-case";
import { ScreeningReportNotFoundError } from "@/core/use-cases/screening-report/errors/screening-report-not-found-error";

export const DeleteScreeningReportController: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/screening-reports/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-reports"],
				summary: "Delete a screening report",
				params: z.object({ id: z.uuid() }),
				response: {
					204: z.void(),
					404: z.object({ message: z.string() }).describe("Screening report not found."),
					500: z.object({ message: z.string() }).describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const useCase = makeDeleteScreeningReportUseCase();

			const result = await useCase.execute({ screeningReportId: id });

			if (result.isLeft()) {
				const error = result.value;
				switch (error.constructor) {
					case ScreeningReportNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: error.message });
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}
			}

			return reply.status(HTTP_STATUS.NO_CONTENT).send();
		},
	);
};

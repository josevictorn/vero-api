import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeEditScreeningReportUseCase } from "@/core/use-cases/screening-report/factories/make-edit-screening-report-use-case";
import { ScreeningReportNotFoundError } from "@/core/use-cases/screening-report/errors/screening-report-not-found-error";

export const EditScreeningReportController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/screening-reports/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-reports"],
				summary: "Edit a screening report",
				params: z.object({ id: z.uuid() }),
				body: z.object({
					title: z.string().min(1).optional(),
					summary: z.string().min(1).optional(),
					/** Payload JSON a ser mesclado com o campo `data` existente. */
					data: z.record(z.string(), z.unknown()).optional(),
				}),
				response: {
					200: z.object({ screeningReportId: z.uuid() }),
					404: z.object({ message: z.string() }).describe("Screening report not found."),
					500: z.object({ message: z.string() }).describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { title, summary, data } = request.body;
			const useCase = makeEditScreeningReportUseCase();

			const result = await useCase.execute({ screeningReportId: id, title, summary, data });

			if (result.isLeft()) {
				const error = result.value;
				switch (error.constructor) {
					case ScreeningReportNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: error.message });
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}
			}

			return reply.status(HTTP_STATUS.OK).send({
				screeningReportId: result.value.screeningReport.id,
			});
		},
	);
};

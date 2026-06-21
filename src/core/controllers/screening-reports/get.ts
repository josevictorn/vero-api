import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeGetScreeningReportUseCase } from "@/core/use-cases/screening-report/factories/make-get-screening-report-use-case";
import { ScreeningReportNotFoundError } from "@/core/use-cases/screening-report/errors/screening-report-not-found-error";

const screeningReportSchema = z.object({
	id: z.uuid(),
	aiSessionId: z.string(),
	leadId: z.string(),
	title: z.string(),
	summary: z.string(),
	data: z.record(z.string(), z.unknown()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const GetScreeningReportController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/screening-reports/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-reports"],
				summary: "Get a screening report by ID",
				params: z.object({ id: z.uuid() }),
				response: {
					200: screeningReportSchema,
					404: z.object({ message: z.string() }).describe("Screening report not found."),
					500: z.object({ message: z.string() }).describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const useCase = makeGetScreeningReportUseCase();

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

			const r = result.value.screeningReport;
			return reply.status(HTTP_STATUS.OK).send({
				id: r.id,
				aiSessionId: r.aiSessionId,
				leadId: r.leadId,
				title: r.title,
				summary: r.summary,
				data: r.data as Record<string, unknown>,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
			});
		},
	);
};

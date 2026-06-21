import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeCreateScreeningReportUseCase } from "@/core/use-cases/screening-report/factories/make-create-screening-report-use-case";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";

export const CreateScreeningReportController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/screening-reports",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-reports"],
				summary: "Create a new screening report",
				body: z.object({
					aiSessionId: z.uuid(),
					leadId: z.uuid(),
					title: z.string().min(1),
					summary: z.string().min(1),
					data: z.record(z.string(), z.unknown()).default({}),
				}),
				response: {
					201: z.object({ screeningReportId: z.uuid() }),
					404: z.object({ message: z.string() }).describe("AI session not found."),
					500: z.object({ message: z.string() }).describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { aiSessionId, leadId, title, summary, data } = request.body;
			const useCase = makeCreateScreeningReportUseCase();

			const result = await useCase.execute({ aiSessionId, leadId, title, summary, data });

			if (result.isLeft()) {
				const error = result.value;
				switch (error.constructor) {
					case AiSessionNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({ message: error.message });
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred." });
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				screeningReportId: result.value.screeningReport.id,
			});
		},
	);
};

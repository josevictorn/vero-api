import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeCreateCaseAnalysisUseCase } from "@/instance/use-cases/case-analysis/factories/make-create-case-analysis-use-case";
import { AiSessionNotFoundError } from "@/core/use-cases/ai-session/errors/ai-session-not-found-error";

export const CreateCaseAnalysisController: FastifyPluginAsyncZod = async (
	app
) => {
	app.post(
		"/case-analysis",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["case-analysis"],
				summary: "Create a new case analysis",
				body: z.object({
					aiSessionId: z.uuid(),
					leadId: z.uuid(),
					title: z.string(),
					viabilityLabel: z.string(),
					analysisText: z.string(),
					estimatedComplexity: z.string(),
					mainLegalBase: z.string(),
				}),
				response: {
					201: z.object({
						caseAnalysisId: z.uuid(),
					}),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({
							message: z.string(),
						})
						.describe("AI session not found."),
					500: z
						.object({
							message: z.string(),
						})
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const {
				aiSessionId,
				leadId,
				title,
				viabilityLabel,
				analysisText,
				estimatedComplexity,
				mainLegalBase,
			} = request.body;
			const createCaseAnalysisUseCase = makeCreateCaseAnalysisUseCase();

			const result = await createCaseAnalysisUseCase.execute({
				aiSessionId,
				leadId,
				title,
				viabilityLabel,
				analysisText,
				estimatedComplexity,
				mainLegalBase,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case AiSessionNotFoundError:
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
				caseAnalysisId: result.value.caseAnalysis.id,
			});
		}
	);
};

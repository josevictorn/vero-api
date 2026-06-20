import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeFetchScreeningFlowsUseCase } from "@/core/use-cases/screening-flows/factories/make-fetch-screening-flows-use-case";
import { InvalidPageError } from "@/core/use-cases/screening-flows/errors/invalid-page-error";

export const FetchScreeningFlowsController: FastifyPluginAsyncZod = async (
	app
) => {
	app.get(
		"/screening-flows",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-flows"],
				summary: "Fetch paginated list of screening flows",
				querystring: z.object({
					page: z.coerce
						.number()
						.int()
						.positive()
						.default(1)
						.describe("Page number"),
				}),
				response: {
					200: z.object({
						results: z.array(
							z.object({
								id: z.uuid(),
								case_type: z.string(),
								questions: z.any(),
								created_at: z.date(),
							})
						),
						meta: z.object({
							currentPage: z.number().int().positive(),
							totalCount: z.number().int().nonnegative(),
							perPage: z.number().int().positive(),
						}),
					}),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { page } = request.query;
			const fetchScreeningFlowsUseCase = makeFetchScreeningFlowsUseCase();

			const result = await fetchScreeningFlowsUseCase.execute({ page });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case InvalidPageError:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { results, meta } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				results: results.map((screeningFlow) => ({
					id: screeningFlow.id,
					case_type: screeningFlow.caseType,
					questions: screeningFlow.questions,
					created_at: screeningFlow.createdAt,
				})),
				meta,
			});
		}
	);
};

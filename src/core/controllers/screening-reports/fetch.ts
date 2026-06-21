import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeFetchScreeningReportsUseCase } from "@/core/use-cases/screening-report/factories/make-fetch-screening-reports-use-case";
import { InvalidPageError } from "@/core/use-cases/screening-report/fetch-screening-reports";

export const FetchScreeningReportsController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/screening-reports",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["screening-reports"],
				summary: "Fetch paginated list of screening reports",
				querystring: z.object({
					page: z.coerce.number().int().positive().default(1).describe("Page number"),
				}),
				response: {
					200: z.object({
						results: z.array(z.object({
							id: z.uuid(),
							aiSessionId: z.string(),
							leadId: z.string(),
							title: z.string(),
							summary: z.string(),
							data: z.record(z.string(), z.unknown()),
							createdAt: z.date(),
							updatedAt: z.date(),
						})),
						meta: z.object({
							currentPage: z.number().int().positive(),
							totalCount: z.number().int().nonnegative(),
							perPage: z.number().int().positive(),
						}),
					}),
					400: z.object({ message: z.string() }).describe("Invalid page."),
					500: z.object({ message: z.string() }).describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { page } = request.query;
			const useCase = makeFetchScreeningReportsUseCase();

			const result = await useCase.execute({ page });

			if (result.isLeft()) {
				return reply.status(HTTP_STATUS.BAD_REQUEST).send({ message: result.value.message });
			}

			const { results, meta } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				results: results.map((r) => ({
					id: r.id,
					aiSessionId: r.aiSessionId,
					leadId: r.leadId,
					title: r.title,
					summary: r.summary,
					data: r.data as Record<string, unknown>,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				})),
				meta,
			});
		},
	);
};

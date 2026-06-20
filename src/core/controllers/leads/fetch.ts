import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeFetchLeadsUseCase } from "@/core/use-cases/leads/factories/make-fetch-leads-use-case";
import { InvalidPageError } from "@/core/use-cases/leads/errors/invalid-page-error";

export const FetchLeadsController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/leads",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["leads"],
				summary: "Fetch paginated list of leads",
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
								workspace_id: z.uuid(),
								lawyer_id: z.uuid().nullable(),
								name: z.string(),
								cellphone: z.string(),
								email: z.string().email().nullable(),
								status: z.enum(["NEW_LEAD", "INTERVIEWING", "FORWARDED", "COMPLETED"]),
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
			const fetchLeadsUseCase = makeFetchLeadsUseCase();

			const result = await fetchLeadsUseCase.execute({ page });

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
				results: results.map((lead) => ({
					id: lead.id,
					workspace_id: lead.workspaceId,
					lawyer_id: lead.lawyerId,
					name: lead.name,
					cellphone: lead.cellphone,
					email: lead.email,
					status: lead.status,
					created_at: lead.createdAt,
				})),
				meta,
			});
		}
	);
};

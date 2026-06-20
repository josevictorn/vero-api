import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeFetchWorkspacesUseCase } from "@/core/use-cases/workspaces/factories/make-fetch-workspaces-use-case";
import { InvalidPageError } from "@/core/use-cases/workspaces/errors/invalid-page-error";

export const FetchWorkspacesController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/workspaces",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["workspaces"],
				summary: "Fetch paginated list of workspaces",
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
								name: z.string(),
								cnpj: z.string(),
								email: z.email(),
								cellphone: z.string(),
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
			const fetchWorkspacesUseCase = makeFetchWorkspacesUseCase();

			const result = await fetchWorkspacesUseCase.execute({ page });

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
				results: results.map((workspace) => ({
					id: workspace.id,
					name: workspace.name,
					cnpj: workspace.cnpj,
					email: workspace.email,
					cellphone: workspace.cellphone,
					created_at: workspace.createdAt,
				})),
				meta,
			});
		}
	);
};

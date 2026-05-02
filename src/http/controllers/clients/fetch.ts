import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { z } from "zod";
import { makeFetchClientsUseCase } from "@/use-cases/clients/factories/make-fetch-clients-use-case";
import { InvalidPageError } from "@/use-cases/users/errors/invalid-page-error";
import { HTTP_STATUS } from "@/utils/constants";

export const FetchClientsController: FastifyPluginAsyncZod = async (app) => {
    app.get(
        "/clients",
        {
            onRequest: [verifyJWT],
            schema: {
                tags: ["clients"],
                summary: "Fetch paginated list of clients",
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
                        clients: z.array(
                            z.object({
                                id: z.uuid(),
                                workspace_id: z.uuid(),
                                lawyer_id: z.uuid().nullable(),
                                name: z.string(),
                                cellphone: z.string(),
                                email: z.email(),
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
            const fetchClientsUseCase = makeFetchClientsUseCase();

            const result = await fetchClientsUseCase.execute({ page });

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
                clients: results.map((client) => ({
                    id: client.id,
                    workspace_id: client.workspaceId,
                    lawyer_id: client.lawyerId,
                    name: client.name,
                    cellphone: client.cellphone,
                    email: client.email,
                    created_at: client.createdAt,
                })),
                meta,
            });
        }
    )
}

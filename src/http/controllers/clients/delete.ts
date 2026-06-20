import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeDeleteClientUseCase } from "@/instance/use-cases/clients/factories/make-delete-client-use-case";
import { ClientNotFoundError } from "@/instance/use-cases/clients/errors/client-not-found-error";

export const DeleteClientController: FastifyPluginAsyncZod = async (app) => {
    app.delete(
        "/clients/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Delete an existing client",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("Client deleted"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("Client not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
        async (request, reply) => {
            const { id } = request.params;
            const deleteClientUseCase = makeDeleteClientUseCase();

            const result = await deleteClientUseCase.execute({ clientId: id });

            if (result.isLeft()) {
                const error = result.value;

                switch (error.constructor) {
                    case ClientNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
                }
            }

            return reply.status(HTTP_STATUS.NO_CONTENT).send(null);
        }
    )
}

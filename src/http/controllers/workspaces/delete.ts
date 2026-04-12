import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
import { makeDeleteWorkspaceUseCase } from "@/use-cases/workspaces/factories/make-delete-workspace-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const DeleteWorkspaceController: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/workspaces/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["workspaces"],
				summary: "Delete an existing workspace",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					204: z.null().describe("Workspace deleted"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("Workspace not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const deleteWorkspaceUseCase = makeDeleteWorkspaceUseCase();

			const result = await deleteWorkspaceUseCase.execute({ workspaceId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case WorkspaceNotFoundError:
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
	);
};

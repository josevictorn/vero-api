import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
import { makeGetWorkspaceUseCase } from "@/use-cases/workspaces/factories/make-get-workspace-use-case";
import { HTTP_STATUS } from "@/utils/constants";

export const GetWorkspacesController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/workspaces/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["workspaces"],
				summary: "Fetch a workspace by ID",
				params: z.object({
					id: z.uuid(),
				}),
				response: {
					200: z
						.object({
							id: z.uuid(),
							name: z.string(),
							cnpj: z.string(),
							email: z.email(),
							cellphone: z.string(),
							created_at: z.date(),
						})
						.describe("Workspace details"),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("Workspace not found"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const getWorkspaceUseCase = makeGetWorkspaceUseCase();

			const result = await getWorkspaceUseCase.execute({ workspaceId: id });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { workspace } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				id: workspace.id,
				name: workspace.name,
				cnpj: workspace.cnpj,
				email: workspace.email,
				cellphone: workspace.cellphone,
				created_at: workspace.createdAt,
			});
		}
	);
};

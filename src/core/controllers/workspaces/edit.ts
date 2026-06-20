import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeEditWorkspaceUseCase } from "@/core/use-cases/workspaces/factories/make-edit-workspace-use-case";
import { WorkspaceNotFoundError } from "@/core/use-cases/workspaces/errors/workspace-not-found-error";
import { CnpjIsAlreadyInUseError } from "@/core/use-cases/workspaces/errors/cnpj-is-already-in-use-error";

const WORKSPACE_NAME_MIN_LENGTH = 3;
const CNPJ_MIN_LENGTH = 14;
const CELLPHONE_MIN_LENGTH = 10;

export const EditWorkspaceController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/workspaces/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["workspaces"],
				summary: "Edit an existing workspace",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					name: z.string().min(WORKSPACE_NAME_MIN_LENGTH).optional(),
					cnpj: z.string().min(CNPJ_MIN_LENGTH).optional(),
					email: z.email().optional(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH).optional(),
				}),
				response: {
					200: z
						.object({
							workspace: z.object({
								id: z.uuid(),
								name: z.string(),
								cnpj: z.string(),
								email: z.email(),
								cellphone: z.string(),
								created_at: z.date(),
							}),
						})
						.describe("Updated workspace"),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("Workspace not found"),
					409: z
						.object({ message: z.string() })
						.describe("CNPJ already in use"),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { name, cnpj, email, cellphone } = request.body;
			const editWorkspaceUseCase = makeEditWorkspaceUseCase();

			const result = await editWorkspaceUseCase.execute({
				workspaceId: id,
				name,
				cnpj,
				email,
				cellphone,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case CnpjIsAlreadyInUseError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const { workspace } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				workspace: {
					id: workspace.id,
					name: workspace.name,
					cnpj: workspace.cnpj,
					email: workspace.email,
					cellphone: workspace.cellphone,
					created_at: workspace.createdAt,
				},
			});
		}
	);
};

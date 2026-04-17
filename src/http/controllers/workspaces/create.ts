import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { CnpjIsAlreadyInUseError } from "@/use-cases/workspaces/errors/cnpj-is-already-in-use-error";
import { makeCreateWorkspaceUseCase } from "@/use-cases/workspaces/factories/make-create-workspace-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const WORKSPACE_NAME_MIN_LENGTH = 3;
const CNPJ_MIN_LENGTH = 14;
const CELLPHONE_MIN_LENGTH = 10;

export const CreateWorkspaceController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/workspaces",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["workspaces"],
				summary: "Create a new workspace",
				body: z.object({
					name: z.string().min(WORKSPACE_NAME_MIN_LENGTH),
					cnpj: z.string().min(CNPJ_MIN_LENGTH),
					email: z.email(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH),
				}),
				response: {
					201: z.object({ workspaceId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					409: z
						.object({ message: z.string() })
						.describe("CNPJ already in use."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { name, cnpj, email, cellphone } = request.body;
			const createWorkspaceUseCase = makeCreateWorkspaceUseCase();

			const result = await createWorkspaceUseCase.execute({
				name,
				cnpj,
				email,
				cellphone,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case CnpjIsAlreadyInUseError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				workspaceId: result.value.workspace.id,
			});
		}
	);
};

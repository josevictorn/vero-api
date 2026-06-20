import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { HTTP_STATUS } from "@/utils/constants";
import { makeCreateLawyerUseCase } from "@/instance/use-cases/lawyers/factories/make-create-lawyer-use-case";
import { UserNotFoundError } from "@/core/use-cases/users/errors/user-not-found-error";
import { WorkspaceNotFoundError } from "@/core/use-cases/workspaces/errors/workspace-not-found-error";
import { LawyerAlreadyExistsError } from "@/instance/use-cases/lawyers/errors/lawyer-already-exists-error";

const CELLPHONE_MIN_LENGTH = 10;

export const CreateLawyerController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/lawyers",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["lawyers"],
				summary: "Create a new lawyer",
				body: z.object({
					userId: z.uuid(),
					workspaceId: z.uuid(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH),
					oab: z.string(),
					oabState: z.string(),
					pix: z.string(),
				}),
				response: {
					201: z.object({ lawyerId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("User or workspace not found."),
					409: z
						.object({ message: z.string() })
						.describe("Lawyer already exists for this user."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const { userId, workspaceId, cellphone, oab, oabState, pix } =
				request.body;
			const createLawyerUseCase = makeCreateLawyerUseCase();

			const result = await createLawyerUseCase.execute({
				userId,
				workspaceId,
				cellphone,
				oab,
				oabState,
				pix,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case UserNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case WorkspaceNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case LawyerAlreadyExistsError:
						return reply.status(HTTP_STATUS.CONFLICT).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.BAD_REQUEST).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			return reply.status(HTTP_STATUS.CREATED).send({
				lawyerId: result.value.lawyer.id,
			});
		}
	);
};

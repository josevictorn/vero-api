import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { LawyerAlreadyExistsError } from "@/use-cases/lawyers/errors/lawyer-already-exists-error";
import { LawyerNotFoundError } from "@/use-cases/lawyers/errors/lawyer-not-found-error";
import { UserNotFoundError } from "@/use-cases/lawyers/errors/user-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/lawyers/errors/workspace-not-found-error";
import { makeEditLawyerUseCase } from "@/use-cases/lawyers/factories/make-edit-lawyer-use-case";
import { HTTP_STATUS } from "@/utils/constants";

const CELLPHONE_MIN_LENGTH = 10;

export const EditLawyerController: FastifyPluginAsyncZod = async (app) => {
	app.patch(
		"/lawyers/:id",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["lawyers"],
				summary: "Edit an existing lawyer",
				params: z.object({
					id: z.uuid(),
				}),
				body: z.object({
					userId: z.uuid().optional(),
					workspaceId: z.uuid().optional(),
					cellphone: z.string().min(CELLPHONE_MIN_LENGTH).optional(),
					oab: z.string().optional(),
					oabState: z.string().optional(),
					pix: z.string().optional(),
				}),
				response: {
					200: z.object({
						lawyer: z.object({
							id: z.uuid(),
							user_id: z.uuid(),
							workspace_id: z.uuid(),
							cellphone: z.string(),
							oab: z.string(),
							oab_state: z.string(),
							pix: z.string(),
							created_at: z.date(),
						}),
					}),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z
						.object({ message: z.string() })
						.describe("Lawyer, user or workspace not found"),
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
			const { id } = request.params;
			const { userId, workspaceId, cellphone, oab, oabState, pix } =
				request.body;
			const editLawyerUseCase = makeEditLawyerUseCase();

			const result = await editLawyerUseCase.execute({
				lawyerId: id,
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
					case LawyerNotFoundError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
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

			const { lawyer } = result.value;

			return reply.status(HTTP_STATUS.OK).send({
				lawyer: {
					id: lawyer.id,
					user_id: lawyer.userId,
					workspace_id: lawyer.workspaceId,
					cellphone: lawyer.cellphone,
					oab: lawyer.oab,
					oab_state: lawyer.oabState,
					pix: lawyer.pix,
					created_at: lawyer.createdAt,
				},
			});
		}
	);
};

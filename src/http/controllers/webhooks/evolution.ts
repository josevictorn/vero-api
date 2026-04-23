import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { HTTP_STATUS } from "@/utils/constants";
import {
	extractMessageText,
	extractPhoneNumber,
	type EvolutionWebhookPayload,
} from "@/providers/evolution/evolution-types";
import { makeGetAiSessionByChatIdUseCase } from "@/use-cases/ai-session/factories/make-get-ai-session-by-chat-id-use-case";
import { makeCreateAiSessionUseCase } from "@/use-cases/ai-session/factories/make-create-ai-session-use-case";
import { makeProcessMessageIdentifyingAgentUseCase } from "@/use-cases/agents/factories/make-process-message-identifying-agent";
import { sendTextMessage } from "@/lib/evolution";
import { AiSessionStatus } from "@generated/prisma/enums";
import { AgentResponseError } from "@/providers/agents/errors/agent-response-error";
import { WorkspaceNotConfiguredError } from "@/use-cases/agents/errors/workspace-not-configured-error";
import { ScreeningFlowNotMatchedError } from "@/use-cases/agents/errors/screening-flow-not-matched-error";
import { ScreeningFlowNotFoundError } from "@/use-cases/ai-session/errors/screening-flow-not-found-error";
import { makeCreateLeadUseCase } from "@/use-cases/leads/factories/make-create-lead-use-case";
import { makeGetWorkspaceUseCase } from "@/use-cases/workspaces/factories/make-get-workspace-use-case";
import { makeFetchWorkspacesUseCase } from "@/use-cases/workspaces/factories/make-fetch-workspaces-use-case";
import { LawyerNotFoundError } from "@/use-cases/lawyers/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "@/use-cases/workspaces/errors/workspace-not-found-error";
export const EvolutionWebhookController: FastifyPluginAsyncZod = async (
	app,
) => {
	app.post(
		"/webhooks/evolution",
		{
			schema: {
				tags: ["webhooks"],
				summary: "Evolution API webhook receiver (messages.upsert)",
				body: z.object({
					event: z.string(),
					instance: z.string(),
					data: z.object({
						key: z.object({
							remoteJid: z.string(),
							fromMe: z.boolean(),
							id: z.string(),
						}),
						message: z.any(),
						pushName: z.string().optional(),
						messageType: z.string(),
					}),
					date_time: z.string(),
					sender: z.string(),
					server_url: z.string(),
					apikey: z.string(),
				}),
				response: {
					200: z.object({ received: z.boolean() }),
					400: z
						.object({ message: z.string() }),
					404: z
						.object({ message: z.string() })
						.describe("Resource not found."),
					500: z
						.object({ message: z.string() })
						.describe("Internal server error."),
				},
			},
		},
		async (request, reply) => {
			const payload = request.body as EvolutionWebhookPayload;

			if (payload.event !== "messages.upsert") {
				return reply
					.status(HTTP_STATUS.OK)
					.send({ received: true });
			}

			if (payload.data.key.fromMe) {
				return reply
					.status(HTTP_STATUS.OK)
					.send({ received: true });
			}

			const messageText = extractMessageText(payload);

			if (!messageText) {
				return reply
					.status(HTTP_STATUS.OK)
					.send({ received: true });
			}
			//acho que tem fazer um use case com esse comecinho, acho que o controller ta mto grande
			const phoneNumber = extractPhoneNumber(payload.data.key.remoteJid);
			const contactName = payload.data.pushName ?? "";
			const chatId = payload.data.key.remoteJid;

			const getAiSessionByChatIdUseCase = makeGetAiSessionByChatIdUseCase();

			const getSessionResult = await getAiSessionByChatIdUseCase.execute({ aiSessionChatId: chatId });

			let activeSession;

			if (getSessionResult.isLeft() || getSessionResult.value.aiSession.status === AiSessionStatus.BOOKED) {
				const createAiSessionUseCase = makeCreateAiSessionUseCase();
				const createResult = await createAiSessionUseCase.execute({
					cellphone: phoneNumber,
					chatId: chatId,
					name: contactName,
					chatState: {}
				});

				if (createResult.isLeft()) {
					const error = createResult.value;

					switch (error.constructor) {
						case ScreeningFlowNotFoundError:
							return reply.status(HTTP_STATUS.NOT_FOUND).send({
								message: error.message,
							});
						default:
							return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
								message: "An unexpected error occurred.",
							});
					}
				}

				activeSession = createResult.value.aiSession;

				const createLead = makeCreateLeadUseCase();

				const getWorkspace = makeFetchWorkspacesUseCase();

				const workspace = await getWorkspace.execute({page : 1});

				if(workspace.isLeft()){
					return reply.status(HTTP_STATUS.NOT_FOUND).send({
						message: workspace.value.message,
					});
				}

				const createLeadResult = await createLead.execute({
					workspaceId: workspace.value.results[0].id,
					name: contactName,
					cellphone: phoneNumber,
				})

				if(createLeadResult.isLeft()) {
					const error = createLeadResult.value;
					
					switch (error.constructor) {
						case WorkspaceNotFoundError:
							return reply.status(HTTP_STATUS.NOT_FOUND).send({
								message: error.message,
							});
						case LawyerNotFoundError:
							return reply.status(HTTP_STATUS.NOT_FOUND).send({
								message: error.message,
							});
						default:
							return reply.status(HTTP_STATUS.BAD_REQUEST).send({
								message: "An unexpected error occurred.",
							});
					}
				}

			} else {
				activeSession = getSessionResult.value.aiSession;
			}

			switch (activeSession.status) {
				case AiSessionStatus.IDENTIFYING: {
					const identifyingUseCase = makeProcessMessageIdentifyingAgentUseCase();
					const result = await identifyingUseCase.execute({
						aiSession: activeSession,
						messageText,
					});

					if (result.isLeft()) {
						const error = result.value;

						switch (error.constructor) {
							case WorkspaceNotConfiguredError:
								return reply.status(HTTP_STATUS.NOT_FOUND).send({
									message: error.message,
								});
							case ScreeningFlowNotMatchedError:
								return reply.status(HTTP_STATUS.NOT_FOUND).send({
									message: error.message,
								});
							case AgentResponseError:
								return reply.status(HTTP_STATUS.BAD_REQUEST).send({
									message: error.message,
								});
							default:
								return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
									message: "An unexpected error occurred.",
								});
						}
					}

					console.log(result.value.messageToClient);

					await sendTextMessage({
						to: chatId,
						text: result.value.messageToClient,
					});
					break;
				}
				case AiSessionStatus.INTERVIEWING:
					break;
				case AiSessionStatus.FORWARDED:
					break;
				case AiSessionStatus.BOOKING:
					break;
				case AiSessionStatus.BOOKED:
					break;
			}

			return reply
				.status(HTTP_STATUS.OK)
				.send({ received: true });
		},
	);
};


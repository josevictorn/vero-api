import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { HTTP_STATUS } from "@/utils/constants";
import {
	extractMessageText,
	extractPhoneNumber,
	type EvolutionWebhookPayload,
} from "@/providers/evolution/evolution-types";
import { sendTextMessage } from "@/lib/evolution";
import { makeHandleIncomingMessageUseCase } from "@/core/use-cases/orchestrator/factories/make-handle-incoming-message-use-case";
import { WorkspaceNotFoundError } from "@/core/use-cases/workspaces/errors/workspace-not-found-error";
import { WorkspaceNotConfiguredError } from "@/core/use-cases/orchestrator/agents/errors/workspace-not-configured-error";
import { ScreeningFlowNotFoundError } from "@/core/use-cases/screening-flows/errors/screening-flow-not-found-error";
import { ScreeningFlowNotMatchedError } from "@/core/use-cases/orchestrator/agents/errors/screening-flow-not-matched-error";
import { makeRouteMessageUseCase } from "@/core/use-cases/orchestrator/factories/make-route-message-use-case";
import { AgentResponseError } from "@core/agents/errors/agent-response-error";
import { lawFirmInstanceConfig } from "@instance/config/instance-config";

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
					502: z
						.object({ message: z.string() })
						.describe("Bad gateway."),
				},
			},
		},
		async (request, reply) => {
			const payload = request.body as EvolutionWebhookPayload;

			if (payload.event !== "messages.upsert" || payload.data.key.fromMe) {
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

			console.log(messageText);

			const phoneNumber = extractPhoneNumber(payload.data.key.remoteJid);
			const contactName = payload.data.pushName ?? "";
			const chatId = payload.data.key.remoteJid;
			
			const handleIncomingMessageUseCase = makeHandleIncomingMessageUseCase(lawFirmInstanceConfig);

			const activeSessionResult = await handleIncomingMessageUseCase.execute({
				phoneNumber,
				contactName,
				chatId
			})

			if(activeSessionResult.isLeft()){
				const error = activeSessionResult.value;

				switch(error.constructor) {
					case WorkspaceNotFoundError:
					case WorkspaceNotConfiguredError:
					case ScreeningFlowNotFoundError:
					case ScreeningFlowNotMatchedError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					default:
						console.error("Erro inesperado no Webhook:", error);
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			const activeSession = activeSessionResult.value.aiSession;

			const routeMessageUseCase = makeRouteMessageUseCase(lawFirmInstanceConfig);
			const routeMessageResult = await routeMessageUseCase.execute({
				aiSession: activeSession,
				messageText: messageText
			})

			if(routeMessageResult.isLeft()) {
				const error = routeMessageResult.value;

				switch(error.constructor) {
					case WorkspaceNotConfiguredError:
					case ScreeningFlowNotMatchedError:
						return reply.status(HTTP_STATUS.NOT_FOUND).send({
							message: error.message,
						});
					case AgentResponseError:
						return reply.status(HTTP_STATUS.BAD_GATEWAY).send({
							message: error.message,
						});
					default:
						return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
							message: "An unexpected error occurred.",
						});
				}
			}

			if(routeMessageResult.value.messageToClient && routeMessageResult.value.messageToClient !== "") {
				console.log("Message to client: ", routeMessageResult.value.messageToClient);
				await sendTextMessage({
					to: chatId,
					text: routeMessageResult.value.messageToClient,
				});
			}

			return reply
				.status(HTTP_STATUS.OK)
				.send({ received: true });
		},
	);
};


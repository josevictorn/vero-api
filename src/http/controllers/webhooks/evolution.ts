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
import { AiSessionStatus } from "@generated/prisma/enums";

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

			const phoneNumber = extractPhoneNumber(payload.data.key.remoteJid);
			const contactName = payload.data.pushName ?? "";
			const chatId = payload.data.key.remoteJid;

			// TODO: Implement orchestration logic here
			// 1. Find or create AiSession by phoneNumber (chatId = remoteJid)
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
					return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
						message: "An unexpected error occurred.",
					});
				}

				activeSession = createResult.value.aiSession;
			} else {
				activeSession = getSessionResult.value.aiSession;
			}

			switch (activeSession.status) {
				case AiSessionStatus.IDENTIFYING:
					break;
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

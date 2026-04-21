import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { HTTP_STATUS } from "@/utils/constants";
import {
	extractMessageText,
	extractPhoneNumber,
	type EvolutionWebhookPayload,
} from "@/providers/evolution/evolution-types";

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

			// TODO: Implement orchestration logic here
			// 1. Find or create AiSession by phoneNumber (chatId = remoteJid)
			// 2. Based on session status, route to the appropriate agent:
			//    - "identifying" → IdentifierAgent
			//    - "interviewing" → InterviewerAgent
			//    - "analyzing" → CaseAnalyzerAgent
			// 3. Update AiSession with agent response
			// 4. Send response via Evolution API (sendTextMessage)
			console.log(
				`[Webhook] Message from ${contactName} (${phoneNumber}): ${messageText}`,
			);

			return reply
				.status(HTTP_STATUS.OK)
				.send({ received: true });
		},
	);
};

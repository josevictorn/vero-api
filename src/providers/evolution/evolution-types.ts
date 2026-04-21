export interface EvolutionWebhookPayload {
	event: string;
	instance: string;
	data: {
		key: {
			remoteJid: string;
			fromMe: boolean;
			id: string;
		};
		message: {
			conversation?: string;
			extendedTextMessage?: { text: string };
		};
		pushName?: string;
		messageType: string;
	};
	date_time: string;
	sender: string;
	server_url: string;
	apikey: string;
}

/**
 * Extracts the text content from the Evolution API message payload.
 * Handles both `conversation` (simple text) and `extendedTextMessage` (quoted/reply) formats.
 */
export function extractMessageText(
	payload: EvolutionWebhookPayload,
): string | null {
	const { message } = payload.data;

	if (message.conversation) {
		return message.conversation;
	}

	if (message.extendedTextMessage?.text) {
		return message.extendedTextMessage.text;
	}

	return null;
}

/**
 * Extracts the phone number from the remoteJid (removes @s.whatsapp.net suffix).
 */
export function extractPhoneNumber(remoteJid: string): string {
	return remoteJid.replace("@s.whatsapp.net", "");
}

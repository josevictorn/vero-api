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

export function extractPhoneNumber(remoteJid: string): string {
	return remoteJid.replace("@s.whatsapp.net", "");
}

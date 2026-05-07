import { env } from "@/env";

const EVOLUTION_BASE_URL = env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = env.EVOLUTION_INSTANCE_NAME;

interface SendTextMessageParams {
	to: string;
	text: string;
}

export async function sendTextMessage({
	to,
	text,
}: SendTextMessageParams): Promise<void> {
	const url = `${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			apikey: EVOLUTION_API_KEY,
		},
		body: JSON.stringify({
			number: to,
			text,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`[EvolutionAPI] Failed to send message to ${to}: ${response.status} - ${errorBody}`,
		);
	}
}

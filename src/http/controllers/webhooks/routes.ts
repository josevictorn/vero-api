import type { FastifyInstance } from "fastify";
import { EvolutionWebhookController } from "./evolution";

export async function webhooksRoutes(app: FastifyInstance) {
	await app.register(EvolutionWebhookController);
}

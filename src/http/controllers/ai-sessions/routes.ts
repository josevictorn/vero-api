import type { FastifyInstance } from "fastify";
import { CreateAiSessionController } from "./create";
import { DeleteAiSessionController } from "./delete";
import { EditAiSessionController } from "./edit";
import { FetchAiSessionsController } from "./fetch";
import { GetAiSessionController } from "./get";

export async function aiSessionsRoutes(app: FastifyInstance) {
	await app.register(CreateAiSessionController);
	await app.register(FetchAiSessionsController);
	await app.register(GetAiSessionController);
	await app.register(EditAiSessionController);
	await app.register(DeleteAiSessionController);
}

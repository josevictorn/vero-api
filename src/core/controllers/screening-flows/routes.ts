import type { FastifyInstance } from "fastify";
import { CreateScreeningFlowController } from "./create";
import { DeleteScreeningFlowController } from "./delete";
import { EditScreeningFlowController } from "./edit";
import { FetchScreeningFlowsController } from "./fetch";
import { GetScreeningFlowsController } from "./get";

export async function screeningFlowsRoutes(app: FastifyInstance) {
	await app.register(CreateScreeningFlowController);
	await app.register(FetchScreeningFlowsController);
	await app.register(GetScreeningFlowsController);
	await app.register(EditScreeningFlowController);
	await app.register(DeleteScreeningFlowController);
}

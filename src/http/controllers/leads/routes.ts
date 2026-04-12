import type { FastifyInstance } from "fastify";
import { CreateLeadController } from "./create";
import { DeleteLeadController } from "./delete";
import { EditLeadController } from "./edit";
import { FetchLeadsController } from "./fetch";
import { GetLeadsController } from "./get";

export async function leadsRoutes(app: FastifyInstance) {
	await app.register(CreateLeadController);
	await app.register(FetchLeadsController);
	await app.register(GetLeadsController);
	await app.register(EditLeadController);
	await app.register(DeleteLeadController);
}

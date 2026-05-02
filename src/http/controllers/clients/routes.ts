import type { FastifyInstance } from "fastify";
import { ConvertLeadToClientController } from "./convert";
import { CreateClientController } from "./create";
import { DeleteClientController } from "./delete";
import { EditClientController } from "./edit";
import { FetchClientsController } from "./fetch";
import { GetClientController } from "./get";

export async function clientsRoutes(app: FastifyInstance) {
	await app.register(ConvertLeadToClientController);
	await app.register(CreateClientController);
	await app.register(GetClientController);
	await app.register(EditClientController);
	await app.register(DeleteClientController);
	await app.register(FetchClientsController);
}

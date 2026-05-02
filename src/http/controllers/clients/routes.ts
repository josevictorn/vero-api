import { FastifyInstance } from "fastify";
import { ConvertLeadToClientController } from "./convert";
import { CreateClientController } from "./create";
import { GetClientController } from "./get";
import { EditclientController } from "./edit";
import { DeleteClientController } from "./delete";
import { FetchClientsController } from "./fetch";

export async function clientsRoutes(app: FastifyInstance) {
    await app.register(ConvertLeadToClientController);
    await app.register(CreateClientController);
    await app.register(GetClientController);
    await app.register(EditclientController);
    await app.register(DeleteClientController);
    await app.register(FetchClientsController);
}

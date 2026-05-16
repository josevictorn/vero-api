import type { FastifyInstance } from "fastify";
import { ConvertLeadToClientController } from "./convert";
import { CreateClientController } from "./create";
import { DeleteClientController } from "./delete";
import { EditClientController } from "./edit";
import { FetchClientsController } from "./fetch";
import { GenerateContractController } from "./generate-contract";
import { GetClientController } from "./get";
import {GenerateRequestController} from "./generate-request";
import {GeneratePetitionController} from "./generate-petition";

export async function clientsRoutes(app: FastifyInstance) {
	await app.register(ConvertLeadToClientController);
	await app.register(CreateClientController);
	await app.register(GetClientController);
	await app.register(EditClientController);
	await app.register(DeleteClientController);
	await app.register(FetchClientsController);
	await app.register(GenerateContractController);
    await app.register(GenerateRequestController);
    await app.register(GeneratePetitionController);
}

import type { FastifyInstance } from "fastify";
import { CreateLawyerController } from "./create";
import { DeleteLawyerController } from "./delete";
import { EditLawyerController } from "./edit";
import { FetchLawyersController } from "./fetch";
import { GetLawyerController } from "./get";

export async function lawyersRoutes(app: FastifyInstance) {
	await app.register(CreateLawyerController);
	await app.register(FetchLawyersController);
	await app.register(GetLawyerController);
	await app.register(EditLawyerController);
	await app.register(DeleteLawyerController);
}

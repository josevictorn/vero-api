import { RegisterUserController } from "@controllers/users/register";
import type { FastifyInstance } from "fastify";
import { AuthenticateController } from "./authenticate";

export async function usersRoutes(app: FastifyInstance) {
	await app.register(RegisterUserController);
	await app.register(AuthenticateController);
}

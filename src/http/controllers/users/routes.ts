import { RegisterUserController } from "@controllers/users/register";
import type { FastifyInstance } from "fastify";

export async function usersRoutes(app: FastifyInstance) {
	await app.register(RegisterUserController);
}

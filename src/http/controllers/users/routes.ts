import type { FastifyInstance } from "fastify";
import { RegisterUserController } from "./register";

export async function usersRoutes(app: FastifyInstance) {
	await app.register(RegisterUserController);
}

import { RegisterUserController } from "@controllers/users/register";
import type { FastifyInstance } from "fastify";
import { AuthenticateController } from "./authenticate";
import { EditUserController } from "./edit";
import { FetchUsersController } from "./fetch";
import { ProfileController } from "./profile";

export async function usersRoutes(app: FastifyInstance) {
	await app.register(RegisterUserController);
	await app.register(AuthenticateController);
	await app.register(ProfileController);
	await app.register(FetchUsersController);
	await app.register(EditUserController);
}

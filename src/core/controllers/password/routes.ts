import { FastifyInstance } from "fastify";
import { ForgotPasswordController } from "./forgot";
import {ResetPasswordConstroller} from "./reset";

export async function passwordRoutes(app: FastifyInstance) {
    await app.register(ForgotPasswordController);
    await app.register(ResetPasswordConstroller);
}

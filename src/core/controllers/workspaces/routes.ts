import type { FastifyInstance } from "fastify";
import { CreateWorkspaceController } from "./create";
import { DeleteWorkspaceController } from "./delete";
import { EditWorkspaceController } from "./edit";
import { FetchWorkspacesController } from "./fetch";
import { GetWorkspacesController } from "./get";

export async function workspacesRoutes(app: FastifyInstance) {
	await app.register(CreateWorkspaceController);
	await app.register(FetchWorkspacesController);
	await app.register(GetWorkspacesController);
	await app.register(EditWorkspaceController);
	await app.register(DeleteWorkspaceController);
}

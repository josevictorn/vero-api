import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { CreateWorkspaceUseCase } from "../create-workspace";

export function makeCreateWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspacesRepository);

	return createWorkspaceUseCase;
}

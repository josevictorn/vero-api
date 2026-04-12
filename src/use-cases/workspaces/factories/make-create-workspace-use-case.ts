import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { CreateWorkspaceUseCase } from "@/use-cases/workspaces/create-workspace";

export function makeCreateWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspacesRepository);

	return createWorkspaceUseCase;
}

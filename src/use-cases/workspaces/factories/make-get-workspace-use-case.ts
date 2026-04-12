import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { GetWorkspaceUseCase } from "@/use-cases/workspaces/get-workspace";

export function makeGetWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const getWorkspaceUseCase = new GetWorkspaceUseCase(workspacesRepository);

	return getWorkspaceUseCase;
}

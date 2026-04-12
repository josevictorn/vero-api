import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { EditWorkspaceUseCase } from "@/use-cases/workspaces/edit-workspace";

export function makeEditWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const editWorkspaceUseCase = new EditWorkspaceUseCase(workspacesRepository);

	return editWorkspaceUseCase;
}

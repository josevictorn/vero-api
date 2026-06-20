import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { EditWorkspaceUseCase } from "../edit-workspace";

export function makeEditWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const editWorkspaceUseCase = new EditWorkspaceUseCase(workspacesRepository);

	return editWorkspaceUseCase;
}

import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { DeleteWorkspaceUseCase } from "@/use-cases/workspaces/delete-workspace";

export function makeDeleteWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(
		workspacesRepository
	);

	return deleteWorkspaceUseCase;
}

import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { DeleteWorkspaceUseCase } from "../delete-workspace";

export function makeDeleteWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(
		workspacesRepository
	);

	return deleteWorkspaceUseCase;
}

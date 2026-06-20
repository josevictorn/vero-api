import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { GetWorkspaceUseCase } from "../get-workspace";

export function makeGetWorkspaceUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const getWorkspaceUseCase = new GetWorkspaceUseCase(workspacesRepository);

	return getWorkspaceUseCase;
}

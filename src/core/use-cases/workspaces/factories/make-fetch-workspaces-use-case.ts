import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { FetchWorkspacesUseCase } from "../fetch-workspaces";

export function makeFetchWorkspacesUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const fetchWorkspacesUseCase = new FetchWorkspacesUseCase(
		workspacesRepository
	);

	return fetchWorkspacesUseCase;
}

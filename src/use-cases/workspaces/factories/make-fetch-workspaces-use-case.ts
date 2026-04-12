import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";
import { FetchWorkspacesUseCase } from "@/use-cases/workspaces/fetch-workspaces";

export function makeFetchWorkspacesUseCase() {
	const workspacesRepository = new PrismaWorkspacesRepository();
	const fetchWorkspacesUseCase = new FetchWorkspacesUseCase(
		workspacesRepository
	);

	return fetchWorkspacesUseCase;
}

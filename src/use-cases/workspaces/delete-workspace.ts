import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

interface DeleteWorkspaceUseCaseRequest {
	workspaceId: string;
}

type DeleteWorkspaceUseCaseResponse = Either<WorkspaceNotFoundError, null>;

export class DeleteWorkspaceUseCase {
	constructor(private readonly workspacesRepository: WorkspacesRepository) {}

	async execute({
		workspaceId,
	}: DeleteWorkspaceUseCaseRequest): Promise<DeleteWorkspaceUseCaseResponse> {
		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		await this.workspacesRepository.delete(workspaceId);

		return right(null);
	}
}

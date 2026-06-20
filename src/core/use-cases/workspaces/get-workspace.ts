import type { Workspace } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";

interface GetWorkspaceUseCaseRequest {
	workspaceId: string;
}

type GetWorkspaceUseCaseResponse = Either<
	WorkspaceNotFoundError,
	{ workspace: Workspace }
>;

export class GetWorkspaceUseCase {
	constructor(private readonly workspacesRepository: WorkspacesRepository) {}

	async execute({
		workspaceId,
	}: GetWorkspaceUseCaseRequest): Promise<GetWorkspaceUseCaseResponse> {
		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		return right({
			workspace,
		});
	}
}

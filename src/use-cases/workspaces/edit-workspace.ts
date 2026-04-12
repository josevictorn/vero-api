import type { Workspace } from "@generated/prisma/client";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { CnpjIsAlreadyInUseError } from "./errors/cnpj-is-already-in-use-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

interface EditWorkspaceUseCaseRequest {
	cellphone?: string;
	cnpj?: string;
	email?: string;
	name?: string;
	workspaceId: string;
}

type EditWorkspaceUseCaseResponse = Either<
	WorkspaceNotFoundError | CnpjIsAlreadyInUseError,
	{ workspace: Workspace }
>;

export class EditWorkspaceUseCase {
	constructor(private readonly workspacesRepository: WorkspacesRepository) {}

	async execute({
		workspaceId,
		name,
		cnpj,
		email,
		cellphone,
	}: EditWorkspaceUseCaseRequest): Promise<EditWorkspaceUseCaseResponse> {
		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		if (cnpj) {
			const workspaceWithSameCnpj =
				await this.workspacesRepository.findByCnpj(cnpj);

			if (workspaceWithSameCnpj && workspaceWithSameCnpj.id !== workspaceId) {
				return left(new CnpjIsAlreadyInUseError(cnpj));
			}
		}

		workspace.name = name ?? workspace.name;
		workspace.cnpj = cnpj ?? workspace.cnpj;
		workspace.email = email ?? workspace.email;
		workspace.cellphone = cellphone ?? workspace.cellphone;

		const updatedWorkspace = await this.workspacesRepository.save(workspace);

		return right({ workspace: updatedWorkspace });
	}
}

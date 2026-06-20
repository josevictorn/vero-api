import type { Workspace } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { CnpjIsAlreadyInUseError } from "./errors/cnpj-is-already-in-use-error";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";

interface CreateWorkspaceUseCaseRequest {
	cellphone: string;
	cnpj: string;
	email: string;
	name: string;
}

type CreateWorkspaceUseCaseResponse = Either<
	CnpjIsAlreadyInUseError,
	{ workspace: Workspace }
>;

export class CreateWorkspaceUseCase {
	constructor(private readonly workspacesRepository: WorkspacesRepository) {}

	async execute({
		name,
		cnpj,
		email,
		cellphone,
	}: CreateWorkspaceUseCaseRequest): Promise<CreateWorkspaceUseCaseResponse> {
		const workspaceWithSameCnpj =
			await this.workspacesRepository.findByCnpj(cnpj);

		if (workspaceWithSameCnpj) {
			return left(new CnpjIsAlreadyInUseError(cnpj));
		}

		const workspace = await this.workspacesRepository.create({
			name,
			cnpj,
			email,
			cellphone,
		});

		return right({
			workspace,
		});
	}
}

import type { Client } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { ClientsRepository } from "@/instance/repositories/clients-repository";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";
import { LawyerNotFoundError } from "../lawyers/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "../lawyers/errors/workspace-not-found-error";

interface CreateClientUseCaseRequest {
	cellphone: string;
	city: string;
	cpf: string;
	email: string;
	issuingAgency: string;
	lawyerId?: string | null;
	maritalStatus: string;
	name: string;
	neighborhood: string;
	profession: string;
	rg: string;
	state: string;
	street: string;
	workspaceId: string;
	zipCode: string;
}

type CreateClientUseCaseResponse = Either<
	WorkspaceNotFoundError | LawyerNotFoundError,
	{ client: Client }
>;

export class CreateClientUseCase {
	constructor(
		private readonly clientsRepository: ClientsRepository,
		private readonly workspacesRepository: WorkspacesRepository,
		private readonly lawyersRepository: LawyersRepository
	) {}

	async execute({
		name,
		email,
		cellphone,
		maritalStatus,
		profession,
		rg,
		issuingAgency,
		cpf,
		street,
		neighborhood,
		city,
		state,
		zipCode,
		workspaceId,
		lawyerId,
	}: CreateClientUseCaseRequest): Promise<CreateClientUseCaseResponse> {
		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		if (lawyerId !== undefined && lawyerId !== null) {
			const lawyer = await this.lawyersRepository.findById(lawyerId);

			if (!lawyer) {
				return left(new LawyerNotFoundError(lawyerId));
			}
		}

		const client = await this.clientsRepository.create({
			name,
			email,
			cellphone,
			maritalStatus,
			profession,
			rg,
			issuingAgency,
			cpf,
			street,
			neighborhood,
			city,
			state,
			zipCode,
			workspaceId,
			lawyerId,
		});

		return right({ client });
	}
}

/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <explanation> */
import type { Client } from "@generated/prisma/client";
import type { ClientsRepository } from "@/repositories/clients-repository";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { ClientNotFoundError } from "./errors/client-not-found-error";

interface EditClientUseCaseRequest {
	cellphone?: string;
	city?: string;
	clientId: string;
	cpf?: string;
	email?: string;
	issuingAgency?: string;
	lawyerId?: string | null;
	maritalStatus?: string;
	name?: string;
	neighborhood?: string;
	profession?: string;
	rg?: string;
	state?: string;
	street?: string;
	workspaceId?: string;
	zipCode?: string;
}

type EditClientUseCaseResponse = Either<
	ClientNotFoundError | WorkspaceNotFoundError | LawyerNotFoundError,
	{ client: Client }
>;

export class EditClientUseCase {
	constructor(
		private readonly clientsRepository: ClientsRepository,
		private readonly lawyersRepository: LawyersRepository,
		private readonly workspacesRepository: WorkspacesRepository
	) {}

	async execute({
		clientId,
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
	}: EditClientUseCaseRequest): Promise<EditClientUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId);

		if (!client) {
			return left(new ClientNotFoundError(clientId));
		}

		if (workspaceId) {
			const workspace = await this.workspacesRepository.findById(workspaceId);

			if (!workspace) {
				return left(new WorkspaceNotFoundError(workspaceId));
			}
		}

		if (lawyerId !== undefined && lawyerId !== null) {
			const lawyer = await this.lawyersRepository.findById(lawyerId);

			if (!lawyer) {
				return left(new LawyerNotFoundError(lawyerId));
			}
		}

		const updatedClient = await this.clientsRepository.save({
			...client,
			name: name ?? client.name,
			email: email ?? client.email,
			cellphone: cellphone ?? client.cellphone,
			maritalStatus: maritalStatus ?? client.maritalStatus,
			profession: profession ?? client.profession,
			rg: rg ?? client.rg,
			issuingAgency: issuingAgency ?? client.issuingAgency,
			cpf: cpf ?? client.cpf,
			street: street ?? client.street,
			neighborhood: neighborhood ?? client.neighborhood,
			city: city ?? client.city,
			state: state ?? client.state,
			zipCode: zipCode ?? client.zipCode,
			workspaceId: workspaceId ?? client.workspaceId,
			lawyerId: lawyerId === undefined ? client.lawyerId : lawyerId,
		});

		return right({ client: updatedClient });
	}
}

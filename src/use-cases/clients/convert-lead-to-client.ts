import type { Client } from "@generated/prisma/client";
import type { ClientsRepository } from "@/repositories/clients-repository";
import type { LeadsRepository } from "@/repositories/leads-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LeadNotFoundError } from "../leads/errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { LeadAlreadyConvertedError } from "./errors/lead-already-converted-error";

interface ConvertLeadToClientUseCaseRequest {
	city: string;
	cpf: string;
	issuingAgency: string;
	leadId: string;
	maritalStatus: string;
	neighborhood: string;
	profession: string;
	rg: string;
	state: string;
	street: string;
	zipCode: string;
}

type ConvertLeadToClientUseCaseResponse = Either<
	LeadNotFoundError | LeadAlreadyConvertedError | WorkspaceNotFoundError,
	{ client: Client }
>;

export class ConvertLeadToClientUseCase {
	constructor(
		private readonly leadsRepository: LeadsRepository,
		private readonly clientsRepository: ClientsRepository,
		private readonly workspacesRepository: WorkspacesRepository
	) {}

	async execute({
		leadId,
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
	}: ConvertLeadToClientUseCaseRequest): Promise<ConvertLeadToClientUseCaseResponse> {
		const lead = await this.leadsRepository.findById(leadId);

		if (!lead) {
			return left(new LeadNotFoundError(leadId));
		}

		const workspace = await this.workspacesRepository.findById(
			lead.workspaceId
		);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(lead.workspaceId));
		}

		const leadAlreadyConverted =
			await this.clientsRepository.findByLeadId(leadId);

		if (leadAlreadyConverted) {
			return left(new LeadAlreadyConvertedError(leadId));
		}

		const client = await this.clientsRepository.create({
			name: lead.name,
			email: lead.email,
			cellphone: lead.cellphone,
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
			workspaceId: lead.workspaceId,
			lawyerId: lead.lawyerId,
			createdFromLeadId: lead.id,
		});

		return right({ client });
	}
}

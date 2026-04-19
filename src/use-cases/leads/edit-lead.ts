import type { Lead, LeadStatus } from "@generated/prisma/client";
import type { LeadsRepository } from "@/repositories/leads-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { LeadNotFoundError } from "./errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

interface EditLeadUseCaseRequest {
	cellphone?: string;
	email?: string;
	lawyerId?: string | null;
	leadId: string;
	name?: string;
	status?: LeadStatus;
	workspaceId?: string;
}

type EditLeadUseCaseResponse = Either<
	LeadNotFoundError | WorkspaceNotFoundError | LawyerNotFoundError,
	{ lead: Lead }
>;

export class EditLeadUseCase {
	constructor(
		private readonly leadsRepository: LeadsRepository,
		private readonly workspacesRepository: WorkspacesRepository,
		private readonly usersRepository: UsersRepository
	) {}

	async execute({
		leadId,
		workspaceId,
		lawyerId,
		name,
		cellphone,
		email,
		status,
	}: EditLeadUseCaseRequest): Promise<EditLeadUseCaseResponse> {
		const lead = await this.leadsRepository.findById(leadId);

		if (!lead) {
			return left(new LeadNotFoundError(leadId));
		}

		if (workspaceId) {
			const workspace = await this.workspacesRepository.findById(workspaceId);

			if (!workspace) {
				return left(new WorkspaceNotFoundError(workspaceId));
			}
		}

		if (lawyerId) {
			const lawyer = await this.usersRepository.findById(lawyerId);

			if (!lawyer) {
				return left(new LawyerNotFoundError(lawyerId));
			}
		}

		lead.workspaceId = workspaceId ?? lead.workspaceId;
		lead.lawyerId = lawyerId === undefined ? lead.lawyerId : lawyerId;
		lead.name = name ?? lead.name;
		lead.cellphone = cellphone ?? lead.cellphone;
		lead.email = email ?? lead.email;
		lead.status = status ?? lead.status;

		const updatedLead = await this.leadsRepository.save(lead);

		return right({
			lead: updatedLead,
		});
	}
}

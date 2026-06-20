import type { Lead, LeadStatus } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";
import { LeadsRepository } from "@/core/repositories/leads-repository";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";
import { UsersRepository } from "@/core/repositories/users-repository";

interface CreateLeadUseCaseRequest {
	cellphone: string;
	email?: string | null;
	lawyerId?: string;
	name: string;
	status?: LeadStatus;
	workspaceId: string;
}

type CreateLeadUseCaseResponse = Either<
	WorkspaceNotFoundError | LawyerNotFoundError,
	{ lead: Lead }
>;

export class CreateLeadUseCase {
	constructor(
		private readonly leadsRepository: LeadsRepository,
		private readonly workspacesRepository: WorkspacesRepository,
		private readonly usersRepository: UsersRepository
	) {}

	async execute({
		workspaceId,
		lawyerId,
		name,
		cellphone,
		email,
		status,
	}: CreateLeadUseCaseRequest): Promise<CreateLeadUseCaseResponse> {
		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		if (lawyerId) {
			const lawyer = await this.usersRepository.findById(lawyerId);

			if (!lawyer) {
				return left(new LawyerNotFoundError(lawyerId));
			}
		}

		const lead = await this.leadsRepository.create({
			workspaceId,
			lawyerId,
			name,
			cellphone,
			email,
			status,
		});

		return right({
			lead,
		});
	}
}

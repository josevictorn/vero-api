import type { Lead, LeadStatus } from "@generated/prisma/client";
import type { LeadsRepository } from "@/repositories/leads-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

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

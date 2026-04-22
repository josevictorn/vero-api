import type { Lawyer } from "@generated/prisma/client";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerAlreadyExistsError } from "./errors/lawyer-already-exists-error";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

interface EditLawyerUseCaseRequest {
	lawyerId: string;
	userId?: string;
	workspaceId?: string;
	cellphone?: string;
}

type EditLawyerUseCaseResponse = Either<
	LawyerNotFoundError | UserNotFoundError | WorkspaceNotFoundError | LawyerAlreadyExistsError,
	{ lawyer: Lawyer }
>;

export class EditLawyerUseCase {
	constructor(
		private readonly lawyersRepository: LawyersRepository,
		private readonly usersRepository: UsersRepository,
		private readonly workspacesRepository: WorkspacesRepository
	) {}

	async execute({
		lawyerId,
		userId,
		workspaceId,
		cellphone,
	}: EditLawyerUseCaseRequest): Promise<EditLawyerUseCaseResponse> {
		const lawyer = await this.lawyersRepository.findById(lawyerId);

		if (!lawyer) {
			return left(new LawyerNotFoundError(lawyerId));
		}

		if (userId) {
			const user = await this.usersRepository.findById(userId);

			if (!user) {
				return left(new UserNotFoundError(userId));
			}

			const existingLawyer = await this.lawyersRepository.findByUserId(userId);

			if (existingLawyer && existingLawyer.id !== lawyerId) {
				return left(new LawyerAlreadyExistsError(userId));
			}
		}

		if (workspaceId) {
			const workspace = await this.workspacesRepository.findById(workspaceId);

			if (!workspace) {
				return left(new WorkspaceNotFoundError(workspaceId));
			}
		}

		lawyer.userId = userId ?? lawyer.userId;
		lawyer.workspaceId = workspaceId ?? lawyer.workspaceId;
		lawyer.cellphone = cellphone ?? lawyer.cellphone;

		const updatedLawyer = await this.lawyersRepository.save(lawyer);

		return right({
			lawyer: updatedLawyer,
		});
	}
}

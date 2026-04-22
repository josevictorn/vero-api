import type { Lawyer } from "@generated/prisma/client";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerAlreadyExistsError } from "./errors/lawyer-already-exists-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

interface CreateLawyerUseCaseRequest {
	userId: string;
	workspaceId: string;
	cellphone: string;
}

type CreateLawyerUseCaseResponse = Either<
	UserNotFoundError | WorkspaceNotFoundError | LawyerAlreadyExistsError,
	{ lawyer: Lawyer }
>;

export class CreateLawyerUseCase {
	constructor(
		private readonly lawyersRepository: LawyersRepository,
		private readonly usersRepository: UsersRepository,
		private readonly workspacesRepository: WorkspacesRepository
	) {}

	async execute({
		userId,
		workspaceId,
		cellphone,
	}: CreateLawyerUseCaseRequest): Promise<CreateLawyerUseCaseResponse> {
		const user = await this.usersRepository.findById(userId);

		if (!user) {
			return left(new UserNotFoundError(userId));
		}

		const workspace = await this.workspacesRepository.findById(workspaceId);

		if (!workspace) {
			return left(new WorkspaceNotFoundError(workspaceId));
		}

		const existingLawyer = await this.lawyersRepository.findByUserId(userId);

		if (existingLawyer) {
			return left(new LawyerAlreadyExistsError(userId));
		}

		const lawyer = await this.lawyersRepository.create({
			userId,
			workspaceId,
			cellphone,
		});

		return right({
			lawyer,
		});
	}
}

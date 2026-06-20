import type { Lawyer } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { LawyerAlreadyExistsError } from "./errors/lawyer-already-exists-error";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";
import { UsersRepository } from "@/core/repositories/users-repository";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";

interface EditLawyerUseCaseRequest {
	cellphone?: string;
	lawyerId: string;
	name?: string;
	oab?: string;
	oabState?: string;
	pix?: string;
	userId?: string;
	workspaceId?: string;
}

type EditLawyerUseCaseResponse = Either<
	| LawyerNotFoundError
	| UserNotFoundError
	| WorkspaceNotFoundError
	| LawyerAlreadyExistsError,
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
		name,
		oab,
		oabState,
		pix,
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
		lawyer.name = name ?? lawyer.name;
		lawyer.oab = oab ?? lawyer.oab;
		lawyer.oabState = oabState ?? lawyer.oabState;
		lawyer.pix = pix ?? lawyer.pix;

		const updatedLawyer = await this.lawyersRepository.save(lawyer);

		return right({
			lawyer: updatedLawyer,
		});
	}
}

import type { Lawyer } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";
import { UsersRepository } from "@/core/repositories/users-repository";

interface GetLawyerUseCaseRequest {
	lawyerId: string;
}

type GetLawyerUseCaseResponse = Either<
	LawyerNotFoundError | UserNotFoundError,
	{
		lawyer: Lawyer;
		user: {
			name: string;
			email: string;
		};
	}
>;

export class GetLawyerUseCase {
	constructor(
		private readonly lawyersRepository: LawyersRepository,
		private readonly usersRepository: UsersRepository
	) {}

	async execute({
		lawyerId,
	}: GetLawyerUseCaseRequest): Promise<GetLawyerUseCaseResponse> {
		const lawyer = await this.lawyersRepository.findById(lawyerId);

		if (!lawyer) {
			return left(new LawyerNotFoundError(lawyerId));
		}

		const user = await this.usersRepository.findById(lawyer.userId);

		if (!user) {
			return left(new UserNotFoundError(lawyer.userId));
		}

		return right({
			lawyer,
			user: {
				name: user.name,
				email: user.email,
			},
		});
	}
}

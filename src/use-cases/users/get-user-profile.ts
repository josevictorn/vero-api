import type { User } from "@generated/prisma/client";
import type { UsersRepository } from "@/repositories/users-repository";
import { type Either, left, right } from "@/utils/either";
import { UserNotFoundError } from "./errors/user-not-found-error";

interface ProfileUseCaseRequest {
	userId: string;
}

type ProfileUseCaseResponse = Either<UserNotFoundError, { user: User }>;

export class GetUserProfileUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		userId,
	}: ProfileUseCaseRequest): Promise<ProfileUseCaseResponse> {
		const user = await this.usersRepository.findById(userId);

		if (!user) {
			return left(new UserNotFoundError(userId));
		}

		return right({
			user,
		});
	}
}

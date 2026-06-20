import type { User } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { UsersRepository } from "@/core/repositories/users-repository";

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

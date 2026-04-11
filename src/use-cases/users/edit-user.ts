import type { Role, User } from "@generated/prisma/client";
import type { UsersRepository } from "@/repositories/users-repository";
import { type Either, left, right } from "@/utils/either";
import { EmailIsAlreadyInUseError } from "./errors/email-is-already-in-use-error";
import { UserNotFoundError } from "./errors/user-not-found-error";

interface EditUserUseCaseRequest {
	email?: string;
	name?: string;
	role?: Role;
	userId: string;
}

type EditUserUseCaseResponse = Either<
	UserNotFoundError | EmailIsAlreadyInUseError,
	{ user: User }
>;

export class EditUserUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		userId,
		name,
		email,
		role,
	}: EditUserUseCaseRequest): Promise<EditUserUseCaseResponse> {
		const user = await this.usersRepository.findById(userId);

		if (!user) {
			return left(new UserNotFoundError(userId));
		}

		if (email) {
			const userWithSameEmail = await this.usersRepository.findByEmail(email);

			if (userWithSameEmail && userWithSameEmail.id !== userId) {
				return left(new EmailIsAlreadyInUseError(email));
			}
		}

		user.name = name ?? user.name;
		user.email = email ?? user.email;
		user.role = role ?? user.role;

		const updatedUser = await this.usersRepository.save(user);

		return right({ user: updatedUser });
	}
}

import type { Role, User } from "@generated/prisma/client";
import type { UsersRepository } from "@repositories/users-repository";
import { UserAlreadyExistsError } from "@usecases/users/errors/user-already-exists-error";
import { type Either, left, right } from "@utils/either";
import { hash } from "argon2";

interface RegisterUserUseCaseRequest {
	email: string;
	name: string;
	password: string;
	role?: Role;
}

type RegisterUserUseCaseResponse = Either<
	UserAlreadyExistsError,
	{ user: User }
>;

export class RegisterUserUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		name,
		email,
		password,
		role,
	}: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
		const password_hash = await hash(password);

		const userWithSameEmail = await this.usersRepository.findByEmail(email);

		if (userWithSameEmail) {
			return left(new UserAlreadyExistsError());
		}

		const user = await this.usersRepository.create({
			name,
			email,
			password_hash,
			role,
		});

		return right({
			user,
		});
	}
}

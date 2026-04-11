import { hash } from "argon2";
import type { Role, User } from "../../../generated/prisma/client";
import type { UsersRepository } from "../../repositories/users-repository";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";

interface RegisterUserUseCaseRequest {
	email: string;
	name: string;
	password: string;
	role?: Role;
}

interface RegisterUserUseCaseResponse {
	user: User;
}

export class RegisterUserUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		name,
		email,
		password,
	}: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
		const password_hash = await hash(password);

		const userWithSameEmail = await this.usersRepository.findByEmail(email);

		if (userWithSameEmail) {
			throw new UserAlreadyExistsError();
		}

		const user = await this.usersRepository.create({
			name,
			email,
			password_hash,
		});

		return {
			user,
		};
	}
}

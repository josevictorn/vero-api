import type { User } from "@generated/prisma/client";
import { verify } from "argon2";
import { type Either, left, right } from "@/utils/either";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";
import { UsersRepository } from "@/core/repositories/users-repository";

interface AuthenticateUseCaseRequest {
	email: string;
	password: string;
}

type AuthenticateUseCaseResponse = Either<
	InvalidCredentialsError,
	{ user: User }
>;

export class AuthenticateUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		email,
		password,
	}: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user) {
			return left(new InvalidCredentialsError());
		}

		const doesPasswordMatch = await verify(user.password_hash, password);

		if (!doesPasswordMatch) {
			return left(new InvalidCredentialsError());
		}

		return right({
			user,
		});
	}
}

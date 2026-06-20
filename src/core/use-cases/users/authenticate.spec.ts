import { hash } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthenticateUseCase } from "./authenticate";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";

let usersRepository: InMemoryUsersRepository;
let sut: AuthenticateUseCase;

describe("Authenticate Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new AuthenticateUseCase(usersRepository);
	});

	it("should be able to authenticate", async () => {
		const user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			email: "johndoe@example.com",
			password: "123456",
		});

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			user: expect.objectContaining({
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			}),
		});
	});

	it("should not be able to authenticate with wrong email", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			email: "wrong@example.com",
			password: "123456",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidCredentialsError);
	});

	it("should not be able to authenticate with wrong password", async () => {
		const user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			email: user.email,
			password: "password",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidCredentialsError);
	});
});

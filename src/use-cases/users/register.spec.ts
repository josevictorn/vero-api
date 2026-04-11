import { verify } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "../../repositories/in-memory/in-memory-users-repository";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";
import { RegisterUserUseCase } from "./register";

let usersRepository: InMemoryUsersRepository;
let sut: RegisterUserUseCase;

describe("Register User Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new RegisterUserUseCase(usersRepository);
	});

	it("should be able to register an user", async () => {
		const result = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		});

		expect(result.isRight()).toBe(true);

		expect(result.value).toEqual(
			expect.objectContaining({
				user: expect.objectContaining({
					id: expect.any(String),
				}),
			})
		);
	});

	it("should store user with role ASSISTANT by default", async () => {
		const result = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.user.role).toBe("ASSISTANT");
		}
	});

	it("should be able to register an user with a specific role", async () => {
		const result = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
			role: "ADMIN",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.user.role).toBe("ADMIN");
		}
	});

	it("should hash user password upon registration", async () => {
		const result = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			const isPasswordCorrectlyHashed = await verify(
				result.value.user.password_hash,
				"123456"
			);
			expect(isPasswordCorrectlyHashed).toBe(true);
		}
	});

	it("should not be able to register with same email twice", async () => {
		const email = "johndoe@example.com";

		await sut.execute({
			name: "John Doe",
			email,
			password: "123456",
		});

		const result = await sut.execute({
			name: "John Doe",
			email,
			password: "123456",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
	});
});

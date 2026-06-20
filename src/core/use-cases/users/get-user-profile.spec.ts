import { hash } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { GetUserProfileUseCase } from "./get-user-profile";

let usersRepository: InMemoryUsersRepository;
let sut: GetUserProfileUseCase;

describe("Authenticate Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new GetUserProfileUseCase(usersRepository);
	});

	it("should be able to get user profile", async () => {
		const user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			userId: user.id,
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

	it("should not be able to get user profile with non existing id", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			userId: "non-existing-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(UserNotFoundError);
	});
});

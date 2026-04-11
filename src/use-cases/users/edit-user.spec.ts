import { hash } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { EditUserUseCase } from "./edit-user";
import { EmailIsAlreadyInUseError } from "./errors/email-is-already-in-use-error";
import { UserNotFoundError } from "./errors/user-not-found-error";

let usersRepository: InMemoryUsersRepository;
let sut: EditUserUseCase;

describe("Edit User Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new EditUserUseCase(usersRepository);
	});

	it("should be able to edit an user", async () => {
		const user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			userId: user.id,
			name: "John Doe Edited",
			email: "johndoeedited@example.com",
			role: "ADMIN",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.user).toEqual(
				expect.objectContaining({
					id: user.id,
					name: "John Doe Edited",
					email: "johndoeedited@example.com",
					role: "ADMIN",
				})
			);
		}
	});

	it("should be able to edit an user with partial data", async () => {
		const user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			userId: user.id,
			name: "John Doe Edited",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.user).toEqual(
				expect.objectContaining({
					id: user.id,
					name: "John Doe Edited",
					email: "johndoe@example.com",
				})
			);
		}
	});

	it("should not be able to edit an user with email that is already in use", async () => {
		const user1 = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
		});

		const user2 = await usersRepository.create({
			name: "Jane Doe",
			email: "janedoe@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({
			userId: user2.id,
			email: "johndoe@example.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(EmailIsAlreadyInUseError);
	});

	it("should not be able to edit a non existing user", async () => {
		const result = await sut.execute({
			userId: "non-existing-user-id",
			name: "John Doe Edited",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(UserNotFoundError);
	});
});

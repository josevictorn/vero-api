import { Role } from "@generated/prisma/enums";
import { hash } from "argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchUsersUseCase } from "./fetch-users";

let usersRepository: InMemoryUsersRepository;
let sut: FetchUsersUseCase;

describe("Fetch Users Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new FetchUsersUseCase(usersRepository);
	});

	it("should be able to fetch users", async () => {
		const account1 = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
			role: Role.ADMIN,
		});
		const account2 = await usersRepository.create({
			name: "John Doe 2",
			email: "johndoe2@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({
					id: account1.id,
					email: account1.email,
					name: account1.name,
					role: account1.role,
				}),
				expect.objectContaining({
					id: account2.id,
					email: account2.email,
					name: account2.name,
					role: account2.role,
				}),
			]),
			meta: {
				currentPage: 1,
				totalCount: 2,
				perPage: 20,
			},
		});
	});

	it("should not be able to fetch accounts with an invalid page", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});

	it("should return an empty list if there are no accounts", async () => {
		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: [],
			meta: {
				currentPage: 1,
				totalCount: 0,
				perPage: 20,
			},
		});
	});

	it("should return an empty list if the page is out of range", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456"),
			role: Role.ADMIN,
		});
		await usersRepository.create({
			name: "John Doe 2",
			email: "johndoe2@example.com",
			password_hash: await hash("123456"),
		});

		const result = await sut.execute({ page: 2 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: [],
			meta: {
				currentPage: 2,
				totalCount: 2,
				perPage: 20,
			},
		});
	});
});

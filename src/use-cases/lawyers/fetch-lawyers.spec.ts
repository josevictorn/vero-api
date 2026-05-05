import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchLawyersUseCase } from "./fetch-lawyers";

let lawyersRepository: InMemoryLawyersRepository;
let usersRepository: InMemoryUsersRepository;
let sut: FetchLawyersUseCase;

describe("Fetch Lawyers Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		usersRepository = new InMemoryUsersRepository();
		sut = new FetchLawyersUseCase(lawyersRepository, usersRepository);
	});

	it("should be able to fetch lawyers", async () => {
		const user1 = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});
		const user2 = await usersRepository.create({
			name: "Maria Santos",
			email: "maria@example.com",
			password_hash: "hash",
		});

		const lawyer1 = await lawyersRepository.create({
			userId: user1.id,
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const lawyer2 = await lawyersRepository.create({
			userId: user2.id,
			workspaceId: "workspace-1",
			cellphone: "11999996666",
			name: "Maria Santos",
			oab: "OAB12378",
			oabState: "SP",
			pix: "pix2@example.com",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({
					lawyer: expect.objectContaining({
						id: lawyer1.id,
						userId: lawyer1.userId,
					}),
					user: {
						name: user1.name,
						email: user1.email,
					},
				}),
				expect.objectContaining({
					lawyer: expect.objectContaining({
						id: lawyer2.id,
						userId: lawyer2.userId,
					}),
					user: {
						name: user2.name,
						email: user2.email,
					},
				}),
			]),
			meta: {
				currentPage: 1,
				totalCount: 2,
				perPage: 20,
			},
		});
	});

	it("should not be able to fetch with invalid page", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});
});

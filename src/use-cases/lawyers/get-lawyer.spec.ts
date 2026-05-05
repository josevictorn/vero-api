import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { GetLawyerUseCase } from "./get-lawyer";

let lawyersRepository: InMemoryLawyersRepository;
let usersRepository: InMemoryUsersRepository;
let sut: GetLawyerUseCase;

describe("Get Lawyer Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		usersRepository = new InMemoryUsersRepository();
		sut = new GetLawyerUseCase(lawyersRepository, usersRepository);
	});

	it("should be able to get a lawyer by id", async () => {
		const user = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const lawyer = await lawyersRepository.create({
			userId: user.id,
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({ lawyerId: lawyer.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			lawyer: expect.objectContaining({
				id: lawyer.id,
				userId: lawyer.userId,
				cellphone: lawyer.cellphone,
			}),
			user: {
				name: user.name,
				email: user.email,
			},
		});
	});

	it("should not be able to get non-existing lawyer", async () => {
		const result = await sut.execute({ lawyerId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

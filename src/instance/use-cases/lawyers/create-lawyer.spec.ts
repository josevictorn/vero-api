import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { CreateLawyerUseCase } from "./create-lawyer";
import { LawyerAlreadyExistsError } from "./errors/lawyer-already-exists-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let lawyersRepository: InMemoryLawyersRepository;
let usersRepository: InMemoryUsersRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let sut: CreateLawyerUseCase;

describe("Create Lawyer Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		usersRepository = new InMemoryUsersRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new CreateLawyerUseCase(
			lawyersRepository,
			usersRepository,
			workspacesRepository
		);
	});

	it("should be able to create a lawyer", async () => {
		const user = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({
			userId: user.id,
			workspaceId: workspace.id,
			cellphone: "11999997777",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lawyer).toEqual(
				expect.objectContaining({
					userId: user.id,
					workspaceId: workspace.id,
					cellphone: "11999997777",
				})
			);
		}
	});

	it("should not be able to create a lawyer with non-existing user", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({
			userId: "non-existing-user",
			workspaceId: workspace.id,
			cellphone: "11999997777",
			oab: "OAB000",
			oabState: "SP",
			pix: "pix@x.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(UserNotFoundError);
	});

	it("should not be able to create a lawyer with non-existing workspace", async () => {
		const user = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const result = await sut.execute({
			userId: user.id,
			workspaceId: "non-existing-workspace",
			cellphone: "11999997777",
			oab: "OAB000",
			oabState: "SP",
			pix: "pix@x.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not be able to create a lawyer if one already exists for the user", async () => {
		const user = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		await sut.execute({
			userId: user.id,
			workspaceId: workspace.id,
			cellphone: "11999997777",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			userId: user.id,
			workspaceId: workspace.id,
			cellphone: "11999996666",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerAlreadyExistsError);
	});
});

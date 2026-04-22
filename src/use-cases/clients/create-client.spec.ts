import { describe, it, expect, beforeEach } from "vitest";
import { CreateClientUseCase } from "./create-client";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";

let clientsRepository: InMemoryClientsRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let usersRepository: InMemoryUsersRepository;
let sut: CreateClientUseCase;

describe("Create Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		usersRepository = new InMemoryUsersRepository();

		sut = new CreateClientUseCase(
			clientsRepository,
			workspacesRepository,
			usersRepository
		);
	});

	it("should be able to create a client without lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const result = await sut.execute({
			name: "João",
			email: "joao@test.com",
			cellphone: "84988888888",
			workspaceId: workspace.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.id).toEqual(expect.any(String));
			expect(result.value.client.workspaceId).toBe(workspace.id);
		}
	});

	it("should be able to create a client with lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer",
			email: "lawyer@test.com",
			password_hash: "123456",
			role: "LAWYER",
		});

		const result = await sut.execute({
			name: "Maria",
			email: "maria@test.com",
			cellphone: "84977777777",
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBe(lawyer.id);
		}
	});

	it("should not be able to create a client with non-existing workspace", async () => {
		const result = await sut.execute({
			name: "João",
			email: "joao@test.com",
			cellphone: "84988888888",
			workspaceId: "invalid-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not be able to create a client with non-existing lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const result = await sut.execute({
			name: "João",
			email: "joao@test.com",
			cellphone: "84988888888",
			workspaceId: workspace.id,
			lawyerId: "invalid-lawyer-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

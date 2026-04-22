import { describe, it, expect, beforeEach } from "vitest";
import { EditClientUseCase } from "./edit-client";

import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";

import { ClientNotFoundError } from "./errors/client-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";

let clientsRepository: InMemoryClientsRepository;
let usersRepository: InMemoryUsersRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let sut: EditClientUseCase;

describe("Edit Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		usersRepository = new InMemoryUsersRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();

		sut = new EditClientUseCase(
			clientsRepository,
			usersRepository,
			workspacesRepository
		);
	});


	it("should be able to update client basic data", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const client = await clientsRepository.create({
			name: "Old Name",
			email: "old@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			name: "New Name",
			email: "new@test.com",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.name).toBe("New Name");
			expect(result.value.client.email).toBe("new@test.com");
			expect(result.value.client.cellphone).toBe("111"); // não mudou
		}
	});

	it("should be able to change workspace", async () => {
		const workspace1 = await workspacesRepository.create({
			name: "W1",
			cnpj: "1",
			email: "1@test.com",
			cellphone: "1",
		});

		const workspace2 = await workspacesRepository.create({
			name: "W2",
			cnpj: "2",
			email: "2@test.com",
			cellphone: "2",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace1.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			workspaceId: workspace2.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.workspaceId).toBe(workspace2.id);
		}
	});

	it("should be able to assign a lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer",
			email: "lawyer@test.com",
			password_hash: "123",
			role: "LAWYER",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			lawyerId: lawyer.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBe(lawyer.id);
		}
	});

	it("should be able to remove lawyer (set null)", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer",
			email: "lawyer@test.com",
			password_hash: "123",
			role: "LAWYER",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
		});

		const result = await sut.execute({
			clientId: client.id,
			lawyerId: null,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBeNull();
		}
	});

	it("should not change lawyer when lawyerId is undefined", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer",
			email: "lawyer@test.com",
			password_hash: "123",
			role: "LAWYER",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
		});

		const result = await sut.execute({
			clientId: client.id,
			name: "Updated",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBe(lawyer.id);
		}
	});

	it("should not be able to update non-existing client", async () => {
		const result = await sut.execute({
			clientId: "invalid-id",
			name: "Test",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ClientNotFoundError);
	});

	it("should not update with non-existing workspace", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			workspaceId: "invalid-workspace",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not update with non-existing lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "123",
			email: "w@test.com",
			cellphone: "999",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "c@test.com",
			cellphone: "111",
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			lawyerId: "invalid-lawyer",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

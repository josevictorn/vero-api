import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { EditClientUseCase } from "./edit-client";
import { ClientNotFoundError } from "./errors/client-not-found-error";

let clientsRepository: InMemoryClientsRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let lawyersRepository: InMemoryLawyersRepository;
let sut: EditClientUseCase;

const baseClientData = {
	maritalStatus: "single",
	profession: "engineer",
	rg: "1234567",
	issuingAgency: "ssp",
	cpf: "12345678901",
	street: "Main St",
	neighborhood: "Downtown",
	city: "Natal",
	state: "RN",
	zipCode: "59000000",
};

describe("Edit Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		lawyersRepository = new InMemoryLawyersRepository();

		sut = new EditClientUseCase(
			clientsRepository,
			lawyersRepository,
			workspacesRepository
		);
	});

	it("should be able to edit a client fully", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace 1",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const client = await clientsRepository.create({
			name: "Old Name",
			email: "old@test.com",
			cellphone: "84911111111",
			...baseClientData,
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const newWorkspace = await workspacesRepository.create({
			name: "Workspace 2",
			cnpj: "98765432000199",
			email: "ws2@test.com",
			cellphone: "84922222222",
		});

		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: newWorkspace.id,
			cellphone: "84933333333",
		});

		const result = await sut.execute({
			clientId: client.id,
			name: "New Name",
			email: "new@test.com",
			cellphone: "84944444444",
			maritalStatus: "married",
			profession: "doctor",
			rg: "7654321",
			issuingAgency: "ssj",
			cpf: "10987654321",
			street: "Second St",
			neighborhood: "Uptown",
			city: "Recife",
			state: "PE",
			zipCode: "50000000",
			workspaceId: newWorkspace.id,
			lawyerId: lawyer.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			const updated = result.value.client;

			expect(updated.name).toBe("New Name");
			expect(updated.email).toBe("new@test.com");
			expect(updated.cellphone).toBe("84944444444");
			expect(updated.maritalStatus).toBe("married");
			expect(updated.profession).toBe("doctor");
			expect(updated.rg).toBe("7654321");
			expect(updated.issuingAgency).toBe("ssj");
			expect(updated.cpf).toBe("10987654321");
			expect(updated.street).toBe("Second St");
			expect(updated.neighborhood).toBe("Uptown");
			expect(updated.city).toBe("Recife");
			expect(updated.state).toBe("PE");
			expect(updated.zipCode).toBe("50000000");
			expect(updated.workspaceId).toBe(newWorkspace.id);
			expect(updated.lawyerId).toBe(lawyer.id);
		}
	});

	it("should be able to partially update a client", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const client = await clientsRepository.create({
			name: "Original",
			email: "original@test.com",
			cellphone: "84911111111",
			...baseClientData,
			workspaceId: workspace.id,
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
			name: "Updated Name",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			const updated = result.value.client;

			expect(updated.name).toBe("Updated Name");
			expect(updated.email).toBe("original@test.com"); // não mudou
		}
	});

	it("should not update when client does not exist", async () => {
		const result = await sut.execute({
			clientId: "invalid-id",
			name: "Test",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ClientNotFoundError);
	});

	it("should not update when workspace does not exist", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "client@test.com",
			cellphone: "84911111111",
			...baseClientData,
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

	it("should not update when lawyer does not exist", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "client@test.com",
			cellphone: "84911111111",
			...baseClientData,
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

	it("should allow setting lawyerId to null (removing lawyer)", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: workspace.id,
			cellphone: "84933333333",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "client@test.com",
			cellphone: "84911111111",
			...baseClientData,
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

	it("should keep lawyerId unchanged when undefined", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace",
			cnpj: "12345678000199",
			email: "ws@test.com",
			cellphone: "84999999999",
		});

		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: workspace.id,
			cellphone: "84933333333",
		});

		const client = await clientsRepository.create({
			name: "Client",
			email: "client@test.com",
			cellphone: "84911111111",
			...baseClientData,
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
		});

		const result = await sut.execute({
			clientId: client.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBe(lawyer.id);
		}
	});
});

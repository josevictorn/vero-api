import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { LawyerNotFoundError } from "../leads/errors/lawyer-not-found-error";

import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { CreateClientUseCase } from "./create-client";

let clientsRepository: InMemoryClientsRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let lawyersRepository: InMemoryLawyersRepository;
let sut: CreateClientUseCase;

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

describe("Create Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		lawyersRepository = new InMemoryLawyersRepository();

		sut = new CreateClientUseCase(
			clientsRepository,
			workspacesRepository,
			lawyersRepository
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
			...baseClientData,
			workspaceId: workspace.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.id).toEqual(expect.any(String));
			expect(result.value.client.workspaceId).toBe(workspace.id);
			expect(result.value.client.lawyerId).toBeNull();
		}
	});

	it("should be able to create a client with lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: workspace.id,
			cellphone: "84999999999",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			name: "Maria",
			email: "maria@test.com",
			cellphone: "84977777777",
			...baseClientData,
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
			...baseClientData,
			workspaceId: "invalid-workspace-id",
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
			...baseClientData,
			workspaceId: workspace.id,
			lawyerId: "invalid-lawyer-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});

	it("should allow passing null as lawyerId", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const result = await sut.execute({
			name: "Carlos",
			email: "carlos@test.com",
			cellphone: "84966666666",
			...baseClientData,
			workspaceId: workspace.id,
			lawyerId: null,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.lawyerId).toBeNull();
		}
	});

	it("should allow passing undefined as lawyerId", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "12345678000199",
			email: "workspace@test.com",
			cellphone: "84999999999",
		});

		const result = await sut.execute({
			name: "Ana",
			email: "ana@test.com",
			cellphone: "84955555555",
			...baseClientData,
			workspaceId: workspace.id,
		});

		expect(result.isRight()).toBe(true);
	});
});

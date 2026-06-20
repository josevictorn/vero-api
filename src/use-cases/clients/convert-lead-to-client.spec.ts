import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { LeadNotFoundError } from "../leads/errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "../workspaces/errors/workspace-not-found-error";
import { ConvertLeadToClientUseCase } from "./convert-lead-to-client";
import { LeadAlreadyConvertedError } from "./errors/lead-already-converted-error";

let leadsRepository: InMemoryLeadsRepository;
let clientsRepository: InMemoryClientsRepository;
let workspacesRepository: InMemoryWorkspacesRepository;

let sut: ConvertLeadToClientUseCase;

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

describe("Convert Lead To Client Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		clientsRepository = new InMemoryClientsRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();

		sut = new ConvertLeadToClientUseCase(
			leadsRepository,
			clientsRepository,
			workspacesRepository
		);
	});

	it("should convert a lead into a client", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "123",
			email: "workspace@test.com",
			cellphone: "999999999",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			name: "João",
			email: "joao@test.com",
			cellphone: "999999999",
			lawyerId: null,
		});

		const result = await sut.execute({
			leadId: lead.id,
			...baseClientData,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.id).toBeDefined();
			expect(result.value.client.createdFromLeadId).toBe(lead.id);
		}
	});

	it("should not convert if lead does not exist", async () => {
		const result = await sut.execute({
			leadId: "non-existing-id",
			...baseClientData,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadNotFoundError);
	});

	it("should not convert if workspace does not exist", async () => {
		const lead = await leadsRepository.create({
			workspaceId: "invalid-workspace",
			name: "João",
			email: "joao@test.com",
			cellphone: "999999999",
			lawyerId: null,
		});

		const result = await sut.execute({
			leadId: lead.id,
			...baseClientData,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not convert if lead is already converted", async () => {
		const workspace = await workspacesRepository.create({
			name: "Workspace Test",
			cnpj: "123",
			email: "workspace@test.com",
			cellphone: "999999999",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			name: "João",
			email: "joao@test.com",
			cellphone: "999999999",
			lawyerId: null,
		});

		await clientsRepository.create({
			name: lead.name,
			email: lead.email as string,
			cellphone: lead.cellphone,
			...baseClientData,
			workspaceId: lead.workspaceId,
			lawyerId: null,
			createdFromLeadId: lead.id,
		});

		const result = await sut.execute({
			leadId: lead.id,
			...baseClientData,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadAlreadyConvertedError);
	});
});

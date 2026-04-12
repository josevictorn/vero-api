import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { EditLeadUseCase } from "./edit-lead";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { LeadNotFoundError } from "./errors/lead-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let leadsRepository: InMemoryLeadsRepository;
let usersRepository: InMemoryUsersRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let sut: EditLeadUseCase;

describe("Edit Lead Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		usersRepository = new InMemoryUsersRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new EditLeadUseCase(
			leadsRepository,
			workspacesRepository,
			usersRepository
		);
	});

	it("should be able to edit lead", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer One",
			email: "lawyer@example.com",
			password_hash: "hash",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			name: "Lead Original",
			cellphone: "11999990001",
			email: "lead@example.com",
		});

		const result = await sut.execute({
			leadId: lead.id,
			lawyerId: lawyer.id,
			name: "Lead Atualizado",
			cellphone: "11999990002",
			email: "lead-updated@example.com",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lead).toEqual(
				expect.objectContaining({
					id: lead.id,
					lawyerId: lawyer.id,
					name: "Lead Atualizado",
					cellphone: "11999990002",
					email: "lead-updated@example.com",
				})
			);
		}
	});

	it("should be able to unassign lawyer from lead", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer One",
			email: "lawyer@example.com",
			password_hash: "hash",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
			name: "Lead Original",
			cellphone: "11999990001",
			email: "lead@example.com",
		});

		const result = await sut.execute({
			leadId: lead.id,
			lawyerId: null,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lead.lawyerId).toBeNull();
		}
	});

	it("should not be able to edit non-existing lead", async () => {
		const result = await sut.execute({
			leadId: "non-existing-id",
			name: "Lead Atualizado",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadNotFoundError);
	});

	it("should not be able to edit with non-existing workspace", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			name: "Lead Original",
			cellphone: "11999990001",
			email: "lead@example.com",
		});

		const result = await sut.execute({
			leadId: lead.id,
			workspaceId: "workspace-not-found",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not be able to edit with non-existing lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const lead = await leadsRepository.create({
			workspaceId: workspace.id,
			name: "Lead Original",
			cellphone: "11999990001",
			email: "lead@example.com",
		});

		const result = await sut.execute({
			leadId: lead.id,
			lawyerId: "lawyer-not-found",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

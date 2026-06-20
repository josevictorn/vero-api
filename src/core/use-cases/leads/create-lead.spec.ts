import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/core/repositories/in-memory/in-memory-leads-repository";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { CreateLeadUseCase } from "./create-lead";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let leadsRepository: InMemoryLeadsRepository;
let usersRepository: InMemoryUsersRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let sut: CreateLeadUseCase;

describe("Create Lead Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		usersRepository = new InMemoryUsersRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new CreateLeadUseCase(
			leadsRepository,
			workspacesRepository,
			usersRepository
		);
	});

	it("should be able to create a lead", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const lawyer = await usersRepository.create({
			name: "Lawyer One",
			email: "lawyer@example.com",
			password_hash: "hash",
		});

		const result = await sut.execute({
			workspaceId: workspace.id,
			lawyerId: lawyer.id,
			name: "Lead Example",
			cellphone: "11999998877",
			email: "lead@example.com",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lead).toEqual(
				expect.objectContaining({
					workspaceId: workspace.id,
					lawyerId: lawyer.id,
					name: "Lead Example",
				})
			);
		}
	});

	it("should not be able to create a lead with non-existing workspace", async () => {
		const result = await sut.execute({
			workspaceId: "non-existing-workspace",
			name: "Lead Example",
			cellphone: "11999998877",
			email: "lead@example.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not be able to create a lead with non-existing lawyer", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({
			workspaceId: workspace.id,
			lawyerId: "non-existing-lawyer",
			name: "Lead Example",
			cellphone: "11999998877",
			email: "lead@example.com",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

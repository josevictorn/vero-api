import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { EditWorkspaceUseCase } from "./edit-workspace";
import { CnpjIsAlreadyInUseError } from "./errors/cnpj-is-already-in-use-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let workspacesRepository: InMemoryWorkspacesRepository;
let sut: EditWorkspaceUseCase;

describe("Edit Workspace Use Case", () => {
	beforeEach(() => {
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new EditWorkspaceUseCase(workspacesRepository);
	});

	it("should be able to edit workspace", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({
			workspaceId: workspace.id,
			name: "Escritório Atualizado",
			cnpj: "22345678000199",
			email: "novo@w1.com",
			cellphone: "11999998877",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.workspace).toEqual(
				expect.objectContaining({
					id: workspace.id,
					name: "Escritório Atualizado",
					cnpj: "22345678000199",
					email: "novo@w1.com",
					cellphone: "11999998877",
				})
			);
		}
	});

	it("should not be able to edit with duplicated CNPJ", async () => {
		const workspace1 = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const workspace2 = await workspacesRepository.create({
			name: "Escritório 2",
			cnpj: "22345678000199",
			email: "contato@w2.com",
			cellphone: "11999998877",
		});

		const result = await sut.execute({
			workspaceId: workspace2.id,
			cnpj: workspace1.cnpj,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CnpjIsAlreadyInUseError);
	});

	it("should not be able to edit non-existing workspace", async () => {
		const result = await sut.execute({
			workspaceId: "non-existing-id",
			name: "Escritório Atualizado",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { CreateWorkspaceUseCase } from "./create-workspace";
import { CnpjIsAlreadyInUseError } from "./errors/cnpj-is-already-in-use-error";

let workspacesRepository: InMemoryWorkspacesRepository;
let sut: CreateWorkspaceUseCase;

describe("Create Workspace Use Case", () => {
	beforeEach(() => {
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new CreateWorkspaceUseCase(workspacesRepository);
	});

	it("should be able to create a workspace", async () => {
		const result = await sut.execute({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.workspace).toEqual(
				expect.objectContaining({
					name: "Escritório Exemplo",
					cnpj: "12345678000199",
					email: "contato@workspace.com",
					cellphone: "11999998888",
				})
			);
		}
	});

	it("should not be able to create with duplicated CNPJ", async () => {
		await sut.execute({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({
			name: "Escritório 2",
			cnpj: "12345678000199",
			email: "contato2@workspace.com",
			cellphone: "11999998887",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CnpjIsAlreadyInUseError);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { DeleteWorkspaceUseCase } from "./delete-workspace";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let workspacesRepository: InMemoryWorkspacesRepository;
let sut: DeleteWorkspaceUseCase;

describe("Delete Workspace Use Case", () => {
	beforeEach(() => {
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new DeleteWorkspaceUseCase(workspacesRepository);
	});

	it("should be able to delete workspace", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({ workspaceId: workspace.id });

		expect(result.isRight()).toBe(true);
		expect(await workspacesRepository.findById(workspace.id)).toBeNull();
	});

	it("should not be able to delete non-existing workspace", async () => {
		const result = await sut.execute({ workspaceId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});
});

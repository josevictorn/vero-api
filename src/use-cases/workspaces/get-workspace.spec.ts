import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacesRepository } from "@/repositories/in-memory/in-memory-workspaces-repository";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";
import { GetWorkspaceUseCase } from "./get-workspace";

let workspacesRepository: InMemoryWorkspacesRepository;
let sut: GetWorkspaceUseCase;

describe("Get Workspace Use Case", () => {
	beforeEach(() => {
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new GetWorkspaceUseCase(workspacesRepository);
	});

	it("should be able to get workspace by id", async () => {
		const workspace = await workspacesRepository.create({
			name: "Escritório Exemplo",
			cnpj: "12345678000199",
			email: "contato@workspace.com",
			cellphone: "11999998888",
		});

		const result = await sut.execute({ workspaceId: workspace.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			workspace: expect.objectContaining({
				id: workspace.id,
				name: workspace.name,
				cnpj: workspace.cnpj,
				email: workspace.email,
				cellphone: workspace.cellphone,
			}),
		});
	});

	it("should not be able to get non-existing workspace", async () => {
		const result = await sut.execute({ workspaceId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});
});

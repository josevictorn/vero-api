import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchWorkspacesUseCase } from "./fetch-workspaces";

let workspacesRepository: InMemoryWorkspacesRepository;
let sut: FetchWorkspacesUseCase;

describe("Fetch Workspaces Use Case", () => {
	beforeEach(() => {
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new FetchWorkspacesUseCase(workspacesRepository);
	});

	it("should be able to fetch workspaces", async () => {
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
			cellphone: "11999998887",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({ id: workspace1.id, cnpj: workspace1.cnpj }),
				expect.objectContaining({ id: workspace2.id, cnpj: workspace2.cnpj }),
			]),
			meta: {
				currentPage: 1,
				totalCount: 2,
				perPage: 20,
			},
		});
	});

	it("should not be able to fetch with invalid page", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});
});

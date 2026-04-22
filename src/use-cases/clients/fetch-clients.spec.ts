import { describe, it, expect, beforeEach } from "vitest";
import { FetchClientsUseCase } from "./fetch-clients";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { InvalidPageError } from "../users/errors/invalid-page-error";
import { ITEM_PER_PAGE } from "@/utils/constants";

let clientsRepository: InMemoryClientsRepository;
let sut: FetchClientsUseCase;

describe("Fetch Clients Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		sut = new FetchClientsUseCase(clientsRepository);
	});


	it("should be able to fetch first page of clients", async () => {
		for (let i = 0; i < 5; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results.length).toBe(5);
			expect(result.value.meta.currentPage).toBe(1);
			expect(result.value.meta.totalCount).toBe(5);
			expect(result.value.meta.perPage).toBe(ITEM_PER_PAGE);
		}
	});

	it("should respect pagination (multiple pages)", async () => {
		for (let i = 0; i < ITEM_PER_PAGE + 3; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 2 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results.length).toBe(3); // sobra da página
			expect(result.value.meta.currentPage).toBe(2);
			expect(result.value.meta.totalCount).toBe(ITEM_PER_PAGE + 3);
		}
	});

	it("should return empty list if page is out of range", async () => {
		for (let i = 0; i < 3; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 2 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results).toHaveLength(0);
			expect(result.value.meta.totalCount).toBe(3);
		}
	});

	it("should return correct totalCount independent of page", async () => {
		for (let i = 0; i < 10; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const resultPage1 = await sut.execute({ page: 1 });
		const resultPage2 = await sut.execute({ page: 2 });

		expect(resultPage1.isRight()).toBe(true);
		expect(resultPage2.isRight()).toBe(true);

		if (resultPage1.isRight() && resultPage2.isRight()) {
			expect(resultPage1.value.meta.totalCount).toBe(10);
			expect(resultPage2.value.meta.totalCount).toBe(10);
		}
	});


	it("should not be able to fetch with page less than 1", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});

	it("should not be able to fetch with negative page", async () => {
		const result = await sut.execute({ page: -1 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { FetchClientsUseCase } from "./fetch-clients";
import { InvalidPageError } from "@/core/use-cases/users/errors/invalid-page-error";

let clientsRepository: InMemoryClientsRepository;
let sut: FetchClientsUseCase;

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

const FIRST_PAGE_CLIENTS_COUNT = 5;
const EXTRA_CLIENTS_COUNT = 3;
const SMALL_LIST_COUNT = 3;
const TOTAL_CLIENTS_COUNT = 10;

describe("Fetch Clients Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		sut = new FetchClientsUseCase(clientsRepository);
	});

	it("should be able to fetch first page of clients", async () => {
		for (let i = 0; i < FIRST_PAGE_CLIENTS_COUNT; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				...baseClientData,
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results.length).toBe(FIRST_PAGE_CLIENTS_COUNT);
			expect(result.value.meta.currentPage).toBe(1);
			expect(result.value.meta.totalCount).toBe(FIRST_PAGE_CLIENTS_COUNT);
			expect(result.value.meta.perPage).toBe(ITEM_PER_PAGE);
		}
	});

	it("should respect pagination (multiple pages)", async () => {
		const totalWithExtra = ITEM_PER_PAGE + EXTRA_CLIENTS_COUNT;
		for (let i = 0; i < totalWithExtra; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				...baseClientData,
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 2 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results.length).toBe(EXTRA_CLIENTS_COUNT); // sobra da página
			expect(result.value.meta.currentPage).toBe(2);
			expect(result.value.meta.totalCount).toBe(totalWithExtra);
		}
	});

	it("should return empty list if page is out of range", async () => {
		for (let i = 0; i < SMALL_LIST_COUNT; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				...baseClientData,
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const result = await sut.execute({ page: 2 });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.results).toHaveLength(0);
			expect(result.value.meta.totalCount).toBe(SMALL_LIST_COUNT);
		}
	});

	it("should return correct totalCount independent of page", async () => {
		for (let i = 0; i < TOTAL_CLIENTS_COUNT; i++) {
			await clientsRepository.create({
				name: `Client ${i}`,
				email: `client${i}@test.com`,
				cellphone: "84999999999",
				...baseClientData,
				workspaceId: "workspace-1",
				lawyerId: null,
			});
		}

		const resultPage1 = await sut.execute({ page: 1 });
		const resultPage2 = await sut.execute({ page: 2 });

		expect(resultPage1.isRight()).toBe(true);
		expect(resultPage2.isRight()).toBe(true);

		if (resultPage1.isRight() && resultPage2.isRight()) {
			expect(resultPage1.value.meta.totalCount).toBe(TOTAL_CLIENTS_COUNT);
			expect(resultPage2.value.meta.totalCount).toBe(TOTAL_CLIENTS_COUNT);
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

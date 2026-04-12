import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchLeadsUseCase } from "./fetch-leads";

let leadsRepository: InMemoryLeadsRepository;
let sut: FetchLeadsUseCase;

describe("Fetch Leads Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		sut = new FetchLeadsUseCase(leadsRepository);
	});

	it("should be able to fetch leads", async () => {
		const lead1 = await leadsRepository.create({
			workspaceId: "workspace-1",
			name: "Lead 1",
			cellphone: "11999990001",
			email: "lead1@example.com",
		});

		const lead2 = await leadsRepository.create({
			workspaceId: "workspace-2",
			name: "Lead 2",
			cellphone: "11999990002",
			email: "lead2@example.com",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({ id: lead1.id, email: lead1.email }),
				expect.objectContaining({ id: lead2.id, email: lead2.email }),
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

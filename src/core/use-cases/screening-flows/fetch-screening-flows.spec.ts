import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryScreeningFlowsRepository } from "@/core/repositories/in-memory/in-memory-screening-flows-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchScreeningFlowsUseCase } from "./fetch-screening-flows";

let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: FetchScreeningFlowsUseCase;

describe("Fetch Screening Flows Use Case", () => {
	beforeEach(() => {
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new FetchScreeningFlowsUseCase(screeningFlowsRepository);
	});

	it("should be able to fetch screening flows", async () => {
		const flow1 = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ id: "q1" }],
		});

		const flow2 = await screeningFlowsRepository.create({
			caseType: "criminal",
			questions: [{ id: "q2" }],
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({ id: flow1.id, caseType: flow1.caseType }),
				expect.objectContaining({ id: flow2.id, caseType: flow2.caseType }),
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

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryScreeningFlowsRepository } from "@/core/repositories/in-memory/in-memory-screening-flows-repository";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";
import { GetScreeningFlowUseCase } from "./get-screening-flow";

let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: GetScreeningFlowUseCase;

describe("Get Screening Flow Use Case", () => {
	beforeEach(() => {
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new GetScreeningFlowUseCase(screeningFlowsRepository);
	});

	it("should be able to get a screening flow by id", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ id: "q1" }],
		});

		const result = await sut.execute({ screeningFlowId: screeningFlow.id });

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.screeningFlow).toEqual(
				expect.objectContaining({
					id: screeningFlow.id,
					caseType: "civil",
				})
			);
		}
	});

	it("should not be able to get non-existing screening flow", async () => {
		const result = await sut.execute({ screeningFlowId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ScreeningFlowNotFoundError);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryScreeningFlowsRepository } from "@/core/repositories/in-memory/in-memory-screening-flows-repository";
import { DeleteScreeningFlowUseCase } from "./delete-screening-flow";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: DeleteScreeningFlowUseCase;

describe("Delete Screening Flow Use Case", () => {
	beforeEach(() => {
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new DeleteScreeningFlowUseCase(screeningFlowsRepository);
	});

	it("should be able to delete screening flow", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ id: "q1" }],
		});

		const result = await sut.execute({ screeningFlowId: screeningFlow.id });

		expect(result.isRight()).toBe(true);

		const flowAfterDelete = await screeningFlowsRepository.findById(
			screeningFlow.id
		);
		expect(flowAfterDelete).toBeNull();
	});

	it("should not be able to delete non-existing screening flow", async () => {
		const result = await sut.execute({ screeningFlowId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ScreeningFlowNotFoundError);
	});
});

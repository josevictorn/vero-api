import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryScreeningFlowsRepository } from "@/repositories/in-memory/in-memory-screening-flows-repository";
import { EditScreeningFlowUseCase } from "./edit-screening-flow";
import { ScreeningFlowNotFoundError } from "./errors/screening-flow-not-found-error";

let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: EditScreeningFlowUseCase;

describe("Edit Screening Flow Use Case", () => {
	beforeEach(() => {
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new EditScreeningFlowUseCase(screeningFlowsRepository);
	});

	it("should be able to edit screening flow", async () => {
		const screeningFlow = await screeningFlowsRepository.create({
			caseType: "civil",
			questions: [{ id: "q1", text: "Pergunta antiga" }],
		});

		const result = await sut.execute({
			screeningFlowId: screeningFlow.id,
			caseType: "labor",
			questions: [{ id: "q1", text: "Pergunta nova" }],
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.screeningFlow).toEqual(
				expect.objectContaining({
					id: screeningFlow.id,
					caseType: "labor",
					questions: expect.arrayContaining([
						{ id: "q1", text: "Pergunta nova" },
					]),
				})
			);
		}
	});

	it("should not be able to edit non-existing screening flow", async () => {
		const result = await sut.execute({
			screeningFlowId: "non-existing-id",
			caseType: "labor",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ScreeningFlowNotFoundError);
	});
});

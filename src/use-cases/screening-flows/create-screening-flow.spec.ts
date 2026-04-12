import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryScreeningFlowsRepository } from "@/repositories/in-memory/in-memory-screening-flows-repository";
import { CreateScreeningFlowUseCase } from "./create-screening-flow";

let screeningFlowsRepository: InMemoryScreeningFlowsRepository;
let sut: CreateScreeningFlowUseCase;

describe("Create Screening Flow Use Case", () => {
	beforeEach(() => {
		screeningFlowsRepository = new InMemoryScreeningFlowsRepository();
		sut = new CreateScreeningFlowUseCase(screeningFlowsRepository);
	});

	it("should be able to create a screening flow", async () => {
		const result = await sut.execute({
			caseType: "civil",
			questions: [
				{
					id: "q1",
					text: "Qual é o seu nome?",
					type: "text",
				},
			],
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.screeningFlow).toEqual(
				expect.objectContaining({
					caseType: "civil",
				})
			);
		}
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { GetLawyerUseCase } from "./get-lawyer";

let lawyersRepository: InMemoryLawyersRepository;
let sut: GetLawyerUseCase;

describe("Get Lawyer Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		sut = new GetLawyerUseCase(lawyersRepository);
	});

	it("should be able to get a lawyer by id", async () => {
		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: "workspace-1",
			cellphone: "11999997777",
		});

		const result = await sut.execute({ lawyerId: lawyer.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			lawyer: expect.objectContaining({
				id: lawyer.id,
				userId: lawyer.userId,
				cellphone: lawyer.cellphone,
			}),
		});
	});

	it("should not be able to get non-existing lawyer", async () => {
		const result = await sut.execute({ lawyerId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { DeleteLawyerUseCase } from "./delete-lawyer";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";

let lawyersRepository: InMemoryLawyersRepository;
let sut: DeleteLawyerUseCase;

describe("Delete Lawyer Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		sut = new DeleteLawyerUseCase(lawyersRepository);
	});

	it("should be able to delete a lawyer", async () => {
		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({ lawyerId: lawyer.id });

		expect(result.isRight()).toBe(true);
		expect(await lawyersRepository.findById(lawyer.id)).toBeNull();
	});

	it("should not be able to delete non-existing lawyer", async () => {
		const result = await sut.execute({ lawyerId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});
});

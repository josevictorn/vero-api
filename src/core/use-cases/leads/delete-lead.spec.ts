import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/core/repositories/in-memory/in-memory-leads-repository";
import { DeleteLeadUseCase } from "./delete-lead";
import { LeadNotFoundError } from "./errors/lead-not-found-error";

let leadsRepository: InMemoryLeadsRepository;
let sut: DeleteLeadUseCase;

describe("Delete Lead Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		sut = new DeleteLeadUseCase(leadsRepository);
	});

	it("should be able to delete lead", async () => {
		const lead = await leadsRepository.create({
			workspaceId: "workspace-1",
			name: "Lead 1",
			cellphone: "11999990001",
			email: "lead1@example.com",
		});

		const result = await sut.execute({ leadId: lead.id });

		expect(result.isRight()).toBe(true);
		expect(await leadsRepository.findById(lead.id)).toBeNull();
	});

	it("should not be able to delete non-existing lead", async () => {
		const result = await sut.execute({ leadId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadNotFoundError);
	});
});

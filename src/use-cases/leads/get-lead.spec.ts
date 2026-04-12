import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { LeadNotFoundError } from "./errors/lead-not-found-error";
import { GetLeadUseCase } from "./get-lead";

let leadsRepository: InMemoryLeadsRepository;
let sut: GetLeadUseCase;

describe("Get Lead Use Case", () => {
	beforeEach(() => {
		leadsRepository = new InMemoryLeadsRepository();
		sut = new GetLeadUseCase(leadsRepository);
	});

	it("should be able to get lead by id", async () => {
		const lead = await leadsRepository.create({
			workspaceId: "workspace-1",
			name: "Lead 1",
			cellphone: "11999990001",
			email: "lead1@example.com",
		});

		const result = await sut.execute({ leadId: lead.id });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			lead: expect.objectContaining({
				id: lead.id,
				name: lead.name,
				email: lead.email,
			}),
		});
	});

	it("should not be able to get non-existing lead", async () => {
		const result = await sut.execute({ leadId: "non-existing-id" });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LeadNotFoundError);
	});
});

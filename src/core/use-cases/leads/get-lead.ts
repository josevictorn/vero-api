import type { Lead } from "@generated/prisma/client";
import { type Either, left, right } from "@/utils/either";
import { LeadNotFoundError } from "./errors/lead-not-found-error";
import { LeadsRepository } from "@/core/repositories/leads-repository";

interface GetLeadUseCaseRequest {
	leadId: string;
}

type GetLeadUseCaseResponse = Either<LeadNotFoundError, { lead: Lead }>;

export class GetLeadUseCase {
	constructor(private readonly leadsRepository: LeadsRepository) {}

	async execute({
		leadId,
	}: GetLeadUseCaseRequest): Promise<GetLeadUseCaseResponse> {
		const lead = await this.leadsRepository.findById(leadId);

		if (!lead) {
			return left(new LeadNotFoundError(leadId));
		}

		return right({
			lead,
		});
	}
}

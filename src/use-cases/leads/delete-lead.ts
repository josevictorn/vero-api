import type { LeadsRepository } from "@/repositories/leads-repository";
import { type Either, left, right } from "@/utils/either";
import { LeadNotFoundError } from "./errors/lead-not-found-error";

interface DeleteLeadUseCaseRequest {
	leadId: string;
}

type DeleteLeadUseCaseResponse = Either<LeadNotFoundError, null>;

export class DeleteLeadUseCase {
	constructor(private readonly leadsRepository: LeadsRepository) {}

	async execute({
		leadId,
	}: DeleteLeadUseCaseRequest): Promise<DeleteLeadUseCaseResponse> {
		const lead = await this.leadsRepository.findById(leadId);

		if (!lead) {
			return left(new LeadNotFoundError(leadId));
		}

		await this.leadsRepository.delete(leadId);

		return right(null);
	}
}

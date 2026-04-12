import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { DeleteLeadUseCase } from "@/use-cases/leads/delete-lead";

export function makeDeleteLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const deleteLeadUseCase = new DeleteLeadUseCase(leadsRepository);

	return deleteLeadUseCase;
}

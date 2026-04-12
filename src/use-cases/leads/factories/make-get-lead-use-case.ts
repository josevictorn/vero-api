import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { GetLeadUseCase } from "@/use-cases/leads/get-lead";

export function makeGetLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const getLeadUseCase = new GetLeadUseCase(leadsRepository);

	return getLeadUseCase;
}

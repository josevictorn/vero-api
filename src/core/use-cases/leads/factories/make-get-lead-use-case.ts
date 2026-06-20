import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { GetLeadUseCase } from "../get-lead";

export function makeGetLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const getLeadUseCase = new GetLeadUseCase(leadsRepository);

	return getLeadUseCase;
}

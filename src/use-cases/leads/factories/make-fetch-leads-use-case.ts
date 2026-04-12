import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { FetchLeadsUseCase } from "@/use-cases/leads/fetch-leads";

export function makeFetchLeadsUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const fetchLeadsUseCase = new FetchLeadsUseCase(leadsRepository);

	return fetchLeadsUseCase;
}

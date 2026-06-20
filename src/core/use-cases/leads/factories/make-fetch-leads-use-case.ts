import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { FetchLeadsUseCase } from "../fetch-leads";

export function makeFetchLeadsUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const fetchLeadsUseCase = new FetchLeadsUseCase(leadsRepository);

	return fetchLeadsUseCase;
}

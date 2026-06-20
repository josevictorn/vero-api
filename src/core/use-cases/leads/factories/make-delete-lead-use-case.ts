import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { DeleteLeadUseCase } from "../delete-lead";

export function makeDeleteLeadUseCase() {
	const leadsRepository = new PrismaLeadsRepository();
	const deleteLeadUseCase = new DeleteLeadUseCase(leadsRepository);

	return deleteLeadUseCase;
}

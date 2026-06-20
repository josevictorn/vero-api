import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaLeadsRepository } from "@/core/repositories/prisma/prisma-leads-repository";
import { PrismaWorkspacesRepository } from "@/core/repositories/prisma/prisma-workspaces-repository";
import { ConvertLeadToClientUseCase } from "../convert-lead-to-client";


export function makeConvertLeadToClientUseCase() {
	return new ConvertLeadToClientUseCase(
		new PrismaLeadsRepository(),
		new PrismaClientsRepository(),
		new PrismaWorkspacesRepository()
	);
}

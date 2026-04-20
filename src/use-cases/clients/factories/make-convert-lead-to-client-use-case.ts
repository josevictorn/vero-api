import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { PrismaClientsRepository } from "@/repositories/prisma/prisma-clients-repository";
import { PrismaWorkspacesRepository } from "@/repositories/prisma/prisma-workspaces-repository";

import { ConvertLeadToClientUseCase } from "@/use-cases/clients/convert-lead-to-client";

export function makeConvertLeadToClientUseCase() {
	return new ConvertLeadToClientUseCase(
		new PrismaLeadsRepository(),
		new PrismaClientsRepository(),
		new PrismaWorkspacesRepository()
	);
}

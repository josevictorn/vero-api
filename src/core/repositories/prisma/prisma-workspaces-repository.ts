import type { Prisma, Workspace } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";

export class PrismaWorkspacesRepository implements WorkspacesRepository {
	async findByCnpj(cnpj: string) {
		const workspace = await prisma.workspace.findUnique({
			where: { cnpj },
		});

		return workspace;
	}

	async findById(id: string) {
		const workspace = await prisma.workspace.findUnique({
			where: { id },
		});

		return workspace;
	}

	async findFirst() {
		const workspace = await prisma.workspace.findFirst();

		return workspace;
	}

	async create(data: Prisma.WorkspaceCreateInput) {
		const workspace = await prisma.workspace.create({
			data,
		});

		return workspace;
	}

	async findMany(params: PaginationParams) {
		const [workspaces, total] = await prisma.$transaction([
			prisma.workspace.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
			}),
			prisma.workspace.count(),
		]);

		return {
			items: workspaces,
			total,
		};
	}

	async save(data: Workspace) {
		const updatedWorkspace = await prisma.workspace.update({
			where: { id: data.id },
			data,
		});

		return updatedWorkspace;
	}

	async delete(id: string) {
		await prisma.workspace.delete({
			where: { id },
		});
	}
}

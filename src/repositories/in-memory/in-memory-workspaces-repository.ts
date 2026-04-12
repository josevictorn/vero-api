import { randomUUID } from "node:crypto";
import type { Prisma, Workspace } from "@generated/prisma/client";
import type { WorkspacesRepository } from "@/repositories/workspaces-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryWorkspacesRepository implements WorkspacesRepository {
	private items: Workspace[] = [];

	async findByCnpj(cnpj: string) {
		const workspace = this.items.find((item) => item.cnpj === cnpj);

		if (!workspace) {
			return null;
		}

		return workspace;
	}

	async findById(id: string) {
		const workspace = this.items.find((item) => item.id === id);

		if (!workspace) {
			return null;
		}

		return workspace;
	}

	async create(data: Prisma.WorkspaceCreateInput) {
		const workspace = {
			id: randomUUID(),
			name: data.name,
			cnpj: data.cnpj,
			email: data.email,
			cellphone: data.cellphone,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(workspace);

		return workspace;
	}

	async findMany(params: PaginationParams) {
		const workspaces = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: workspaces,
			total: this.items.length,
		};
	}

	async save(data: Workspace) {
		const workspaceIndex = this.items.findIndex((item) => item.id === data.id);

		if (workspaceIndex >= 0) {
			this.items[workspaceIndex] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

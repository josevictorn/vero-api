import type { Prisma, Workspace } from "@generated/prisma/client";
import type { PaginatedResult } from "@/utils/paginated-results";
import type { PaginationParams } from "@/utils/pagination-params";

export interface WorkspacesRepository {
	create(data: Prisma.WorkspaceCreateInput): Promise<Workspace>;
	delete(id: string): Promise<void>;
	findByCnpj(cnpj: string): Promise<Workspace | null>;
	findById(id: string): Promise<Workspace | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<Workspace>>;
	save(workspace: Workspace): Promise<Workspace>;
}

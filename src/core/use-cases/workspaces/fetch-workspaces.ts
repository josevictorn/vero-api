import type { Workspace } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";
import { WorkspacesRepository } from "@/core/repositories/workspaces-repository";

interface FetchWorkspacesUseCaseRequest {
	page: number;
}

type FetchWorkspacesUseCaseResponse = Either<
	InvalidPageError,
	{
		results: Workspace[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchWorkspacesUseCase {
	constructor(private readonly workspacesRepository: WorkspacesRepository) {}

	async execute({
		page,
	}: FetchWorkspacesUseCaseRequest): Promise<FetchWorkspacesUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const workspaces = await this.workspacesRepository.findMany({ page });

		return right({
			results: workspaces.items,
			meta: {
				currentPage: page,
				totalCount: workspaces.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

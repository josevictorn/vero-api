import type { User } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";
import { UsersRepository } from "@/core/repositories/users-repository";

interface FetchUsersUseCaseRequest {
	page: number;
}

type FetchUsersUseCaseResponse = Either<
	InvalidPageError,
	{
		results: User[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchUsersUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute({
		page,
	}: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const users = await this.usersRepository.findMany({
			page,
		});

		return right({
			results: users.items,
			meta: {
				currentPage: page,
				totalCount: users.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

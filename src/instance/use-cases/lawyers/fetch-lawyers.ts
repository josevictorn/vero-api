import type { Lawyer } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";
import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "./errors/invalid-page-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";
import { UsersRepository } from "@/core/repositories/users-repository";

interface FetchLawyersUseCaseRequest {
	page: number;
}

interface FetchLawyerItem {
	lawyer: Lawyer;
	user: {
		name: string;
		email: string;
	};
}

type FetchLawyersUseCaseResponse = Either<
	InvalidPageError | UserNotFoundError,
	{
		results: FetchLawyerItem[];
		meta: {
			currentPage: number;
			totalCount: number;
			perPage: number;
		};
	}
>;

export class FetchLawyersUseCase {
	constructor(
		private readonly lawyersRepository: LawyersRepository,
		private readonly usersRepository: UsersRepository
	) {}

	async execute({
		page,
	}: FetchLawyersUseCaseRequest): Promise<FetchLawyersUseCaseResponse> {
		if (page < 1) {
			return left(new InvalidPageError());
		}

		const lawyers = await this.lawyersRepository.findMany({ page });

		const results: FetchLawyerItem[] = [];

		for (const lawyer of lawyers.items) {
			const user = await this.usersRepository.findById(lawyer.userId);

			if (!user) {
				return left(new UserNotFoundError(lawyer.userId));
			}

			results.push({
				lawyer,
				user: {
					name: user.name,
					email: user.email,
				},
			});
		}

		return right({
			results,
			meta: {
				currentPage: page,
				totalCount: lawyers.total,
				perPage: ITEM_PER_PAGE,
			},
		});
	}
}

import type { Prisma } from "@generated/prisma/client";
import type { UsersRepository } from "@repositories/users-repository";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class PrismaUsersRepository implements UsersRepository {
	async findById(id: string) {
		const user = await prisma.user.findUnique({
			where: { id },
		});

		return user;
	}

	async findByEmail(email: string) {
		const user = await prisma.user.findUnique({
			where: { email },
		});

		return user;
	}

	async create(data: Prisma.UserCreateInput) {
		const user = await prisma.user.create({
			data,
		});

		return user;
	}

	async findMany(params: PaginationParams) {
		const [users, total] = await prisma.$transaction([
			prisma.user.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
			}),
			prisma.user.count(),
		]);

		return {
			items: users,
			total,
		};
	}
}

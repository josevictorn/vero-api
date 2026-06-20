import type { Prisma, User } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { UsersRepository } from "@/core/repositories/users-repository";

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

	async save(data: User) {
		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data,
		});

		return updatedUser;
	}
}

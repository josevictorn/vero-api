import { randomUUID } from "node:crypto";
import { type Prisma, Role, type User } from "@generated/prisma/client";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { UsersRepository } from "@/core/repositories/users-repository";

export class InMemoryUsersRepository implements UsersRepository {
	private readonly items: User[] = [];

	async findById(id: string) {
		const user = this.items.find((item) => item.id === id);

		if (!user) {
			return null;
		}

		return user;
	}

	async findByEmail(email: string) {
		const user = this.items.find((item) => item.email === email);

		if (!user) {
			return null;
		}

		return user;
	}

	async create(data: Prisma.UserCreateInput) {
		const user = {
			id: randomUUID(),
			name: data.name,
			email: data.email,
			password_hash: data.password_hash,
			role: data.role || Role.ASSISTANT,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(user);

		return user;
	}

	async findMany(params: PaginationParams) {
		const users = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: users,
			total: this.items.length,
		};
	}

	async save(data: User) {
		const userIndex = this.items.findIndex((item) => item.id === data.id);

		if (userIndex >= 0) {
			this.items[userIndex] = data;
		}

		return data;
	}
}

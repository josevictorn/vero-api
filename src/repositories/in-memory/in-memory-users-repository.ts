import { randomUUID } from "node:crypto";
import { type Prisma, Role, type User } from "@generated/prisma/client";
import type { UsersRepository } from "@/repositories/users-repository";

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
}

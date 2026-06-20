import { randomUUID } from "node:crypto";
import type { GoogleCalendarConnection, Prisma } from "@generated/prisma/client";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";

export class InMemoryCalendarConnectionsRepository
	implements CalendarConnectionsRepository
{
	items: GoogleCalendarConnection[] = [];

	async findByUserId(userId: string) {
		const connection = this.items.find((item) => item.userId === userId);

		return connection ?? null;
	}

	async upsertByUserId(
		userId: string,
		data: Prisma.GoogleCalendarConnectionUncheckedCreateInput
	) {
		const connectionIndex = this.items.findIndex((item) => item.userId === userId);
		const now = new Date();

		const connection: GoogleCalendarConnection = {
			id:
				connectionIndex >= 0
					? this.items[connectionIndex].id
					: data.id ?? randomUUID(),
			userId,
			googleEmail: data.googleEmail,
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			tokenExpiresAt: new Date(data.tokenExpiresAt),
			createdAt:
				connectionIndex >= 0 ? this.items[connectionIndex].createdAt : now,
			updatedAt: now,
		};

		if (connectionIndex >= 0) {
			this.items[connectionIndex] = connection;
			return connection;
		}

		this.items.push(connection);

		return connection;
	}

	async deleteByUserId(userId: string) {
		this.items = this.items.filter((item) => item.userId !== userId);
	}
}

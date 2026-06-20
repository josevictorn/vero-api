import type { Prisma } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";

export class PrismaCalendarConnectionsRepository
	implements CalendarConnectionsRepository
{
	async findByUserId(userId: string) {
		return prisma.googleCalendarConnection.findUnique({
			where: { userId },
		});
	}

	async upsertByUserId(
		userId: string,
		data: Prisma.GoogleCalendarConnectionUncheckedCreateInput
	) {
		return prisma.googleCalendarConnection.upsert({
			where: { userId },
			create: {
				...data,
				userId,
			},
			update: {
				googleEmail: data.googleEmail,
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				tokenExpiresAt: data.tokenExpiresAt,
			},
		});
	}

	async deleteByUserId(userId: string) {
		await prisma.googleCalendarConnection.deleteMany({
			where: { userId },
		});
	}
}

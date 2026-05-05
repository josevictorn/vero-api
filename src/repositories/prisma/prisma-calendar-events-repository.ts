import type { Prisma } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CalendarEventsRepository } from "@/repositories/calendar-events-repository";

export class PrismaCalendarEventsRepository
	implements CalendarEventsRepository
{
	async upsertByGoogleEventId(
		userId: string,
		googleEventId: string,
		data: Omit<
			Prisma.CalendarEventUncheckedCreateInput,
			"userId" | "googleEventId"
		>
	) {
		return prisma.calendarEvent.upsert({
			where: {
				userId_googleEventId: {
					userId,
					googleEventId,
				},
			},
			create: {
				...data,
				userId,
				googleEventId,
			},
			update: {
				summary: data.summary,
				description: data.description,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
				hangoutLink: data.hangoutLink,
			},
		});
	}

	async deleteByGoogleEventId(userId: string, googleEventId: string) {
		await prisma.calendarEvent.deleteMany({
			where: {
				userId,
				googleEventId,
			},
		});
	}
}

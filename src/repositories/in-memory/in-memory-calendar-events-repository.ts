import { randomUUID } from "node:crypto";
import type { CalendarEvent, Prisma } from "@generated/prisma/client";
import type { CalendarEventsRepository } from "@/repositories/calendar-events-repository";

export class InMemoryCalendarEventsRepository implements CalendarEventsRepository {
	items: CalendarEvent[] = [];

	async upsertByGoogleEventId(
		userId: string,
		googleEventId: string,
		data: Omit<Prisma.CalendarEventUncheckedCreateInput, "userId" | "googleEventId">
	) {
		const eventIndex = this.items.findIndex(
			(item) => item.userId === userId && item.googleEventId === googleEventId
		);
		const now = new Date();

		const event: CalendarEvent = {
			id: eventIndex >= 0 ? this.items[eventIndex].id : data.id ?? randomUUID(),
			userId,
			googleEventId,
			summary: data.summary,
			description: data.description ?? null,
			startsAt: new Date(data.startsAt),
			endsAt: new Date(data.endsAt),
			hangoutLink: data.hangoutLink ?? null,
			createdAt: eventIndex >= 0 ? this.items[eventIndex].createdAt : now,
			updatedAt: now,
		};

		if (eventIndex >= 0) {
			this.items[eventIndex] = event;
			return event;
		}

		this.items.push(event);

		return event;
	}

	async deleteByGoogleEventId(userId: string, googleEventId: string) {
		this.items = this.items.filter(
			(item) => !(item.userId === userId && item.googleEventId === googleEventId)
		);
	}
}

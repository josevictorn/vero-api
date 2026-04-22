import type { CalendarEvent, Prisma } from "@generated/prisma/client";

export interface CalendarEventsRepository {
	deleteByGoogleEventId(userId: string, googleEventId: string): Promise<void>;
	upsertByGoogleEventId(
		userId: string,
		googleEventId: string,
		data: Omit<
			Prisma.CalendarEventUncheckedCreateInput,
			"userId" | "googleEventId"
		>
	): Promise<CalendarEvent>;
}

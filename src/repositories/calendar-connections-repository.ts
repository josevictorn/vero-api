import type {
	GoogleCalendarConnection,
	Prisma,
} from "@generated/prisma/client";

export interface CalendarConnectionsRepository {
	deleteByUserId(userId: string): Promise<void>;
	findByUserId(userId: string): Promise<GoogleCalendarConnection | null>;
	upsertByUserId(
		userId: string,
		data: Prisma.GoogleCalendarConnectionUncheckedCreateInput
	): Promise<GoogleCalendarConnection>;
}

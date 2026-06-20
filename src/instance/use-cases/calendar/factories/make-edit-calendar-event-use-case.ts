import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { PrismaCalendarEventsRepository } from "@/repositories/prisma/prisma-calendar-events-repository";
import { EditCalendarEventUseCase } from "../edit-calendar-event";

export function makeEditCalendarEventUseCase() {
	const calendarConnectionsRepository = new PrismaCalendarConnectionsRepository();
	const calendarEventsRepository = new PrismaCalendarEventsRepository();
	const calendarGateway = makeGoogleCalendarGateway();

	return new EditCalendarEventUseCase(
		calendarConnectionsRepository,
		calendarEventsRepository,
		calendarGateway
	);
}

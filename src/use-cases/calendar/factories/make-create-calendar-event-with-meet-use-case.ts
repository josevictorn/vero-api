import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { PrismaCalendarEventsRepository } from "@/repositories/prisma/prisma-calendar-events-repository";
import { CreateCalendarEventWithMeetUseCase } from "../create-calendar-event-with-meet";

export function makeCreateCalendarEventWithMeetUseCase() {
	const calendarConnectionsRepository = new PrismaCalendarConnectionsRepository();
	const calendarEventsRepository = new PrismaCalendarEventsRepository();
	const calendarGateway = makeGoogleCalendarGateway();

	return new CreateCalendarEventWithMeetUseCase(
		calendarConnectionsRepository,
		calendarEventsRepository,
		calendarGateway
	);
}

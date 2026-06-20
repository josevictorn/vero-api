import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { PrismaCalendarEventsRepository } from "@/repositories/prisma/prisma-calendar-events-repository";
import { DeleteCalendarEventUseCase } from "../delete-calendar-event";

export function makeDeleteCalendarEventUseCase() {
	const calendarConnectionsRepository =
		new PrismaCalendarConnectionsRepository();
	const calendarEventsRepository = new PrismaCalendarEventsRepository();
	const calendarGateway = makeGoogleCalendarGateway();

	return new DeleteCalendarEventUseCase(
		calendarConnectionsRepository,
		calendarEventsRepository,
		calendarGateway
	);
}

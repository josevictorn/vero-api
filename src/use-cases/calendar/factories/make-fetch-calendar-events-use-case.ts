import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { FetchCalendarEventsUseCase } from "../fetch-calendar-events";

export function makeFetchCalendarEventsUseCase() {
	const calendarConnectionsRepository = new PrismaCalendarConnectionsRepository();
	const calendarGateway = makeGoogleCalendarGateway();

	return new FetchCalendarEventsUseCase(
		calendarConnectionsRepository,
		calendarGateway
	);
}

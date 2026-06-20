import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { GetCalendarEventUseCase } from "../get-calendar-event";

export function makeGetCalendarEventUseCase() {
	const calendarConnectionsRepository =
		new PrismaCalendarConnectionsRepository();
	const calendarGateway = makeGoogleCalendarGateway();

	return new GetCalendarEventUseCase(
		calendarConnectionsRepository,
		calendarGateway
	);
}

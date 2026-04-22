import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { DisconnectGoogleCalendarUseCase } from "../disconnect-google-calendar";

export function makeDisconnectGoogleCalendarUseCase() {
	const calendarConnectionsRepository =
		new PrismaCalendarConnectionsRepository();

	return new DisconnectGoogleCalendarUseCase(calendarConnectionsRepository);
}

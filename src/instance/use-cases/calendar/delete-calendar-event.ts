import type { CalendarGateway } from "@/infra/google/calendar-gateway";
import { type Either, left, right } from "@/utils/either";
import { ensureGoogleAccessToken } from "./ensure-google-access-token";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";
import { CalendarEventsRepository } from "@/instance/repositories/calendar-events-repository";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";

interface DeleteCalendarEventUseCaseRequest {
	eventId: string;
	userId: string;
}

type DeleteCalendarEventUseCaseResponse = Either<
	CalendarConnectionNotFoundError | GoogleCalendarIntegrationError,
	null
>;

export class DeleteCalendarEventUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarEventsRepository: CalendarEventsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		userId,
		eventId,
	}: DeleteCalendarEventUseCaseRequest): Promise<DeleteCalendarEventUseCaseResponse> {
		const connection =
			await this.calendarConnectionsRepository.findByUserId(userId);

		if (!connection) {
			return left(new CalendarConnectionNotFoundError(userId));
		}

		try {
			const accessToken = await ensureGoogleAccessToken({
				connection,
				calendarGateway: this.calendarGateway,
				calendarConnectionsRepository: this.calendarConnectionsRepository,
			});
			await this.calendarGateway.deleteEvent(accessToken, eventId);
			await this.calendarEventsRepository.deleteByGoogleEventId(
				userId,
				eventId
			);
			return right(null);
		} catch {
			return left(new GoogleCalendarIntegrationError());
		}
	}
}

import type {
	CalendarGateway,
	CalendarGatewayEvent,
} from "@/infra/google/calendar-gateway";
import { type Either, left, right } from "@/utils/either";
import { ensureGoogleAccessToken } from "./ensure-google-access-token";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";
import { CalendarEventNotFoundError } from "./errors/calendar-event-not-found-error";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";
import { CalendarEventsRepository } from "@/instance/repositories/calendar-events-repository";

interface EditCalendarEventUseCaseRequest {
	description?: string;
	endsAt?: Date;
	eventId: string;
	startsAt?: Date;
	summary?: string;
	timeZone?: string;
	userId: string;
}

type EditCalendarEventUseCaseResponse = Either<
	| CalendarConnectionNotFoundError
	| CalendarEventNotFoundError
	| GoogleCalendarIntegrationError,
	{ event: CalendarGatewayEvent }
>;

export class EditCalendarEventUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarEventsRepository: CalendarEventsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		userId,
		eventId,
		summary,
		description,
		startsAt,
		endsAt,
		timeZone,
	}: EditCalendarEventUseCaseRequest): Promise<EditCalendarEventUseCaseResponse> {
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
			const event = await this.calendarGateway.updateEvent({
				accessToken,
				eventId,
				summary,
				description,
				startsAt,
				endsAt,
				timeZone,
			});

			if (!event) {
				return left(new CalendarEventNotFoundError(eventId));
			}

			await this.calendarEventsRepository.upsertByGoogleEventId(
				userId,
				event.id,
				{
					summary: event.summary,
					description: event.description,
					startsAt: event.startsAt,
					endsAt: event.endsAt,
					hangoutLink: event.hangoutLink,
				}
			);

			return right({ event });
		} catch {
			return left(new GoogleCalendarIntegrationError());
		}
	}
}

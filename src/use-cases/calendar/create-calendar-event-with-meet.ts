import type {
	CalendarGateway,
	CalendarGatewayEvent,
} from "@/infra/google/calendar-gateway";
import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import type { CalendarEventsRepository } from "@/repositories/calendar-events-repository";
import { type Either, left, right } from "@/utils/either";
import { ensureGoogleAccessToken } from "./ensure-google-access-token";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";

interface CreateCalendarEventWithMeetUseCaseRequest {
	description?: string;
	endsAt: Date;
	startsAt: Date;
	summary: string;
	timeZone?: string;
	userId: string;
}

type CreateCalendarEventWithMeetUseCaseResponse = Either<
	CalendarConnectionNotFoundError | GoogleCalendarIntegrationError,
	{ event: CalendarGatewayEvent }
>;

export class CreateCalendarEventWithMeetUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarEventsRepository: CalendarEventsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		userId,
		summary,
		description,
		startsAt,
		endsAt,
		timeZone,
	}: CreateCalendarEventWithMeetUseCaseRequest): Promise<CreateCalendarEventWithMeetUseCaseResponse> {
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
			const event = await this.calendarGateway.createEventWithMeet({
				accessToken,
				summary,
				description,
				startsAt,
				endsAt,
				timeZone,
			});

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

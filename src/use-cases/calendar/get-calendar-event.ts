import type {
	CalendarGateway,
	CalendarGatewayEvent,
} from "@/infra/google/calendar-gateway";
import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import { type Either, left, right } from "@/utils/either";
import { ensureGoogleAccessToken } from "./ensure-google-access-token";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";
import { CalendarEventNotFoundError } from "./errors/calendar-event-not-found-error";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";

interface GetCalendarEventUseCaseRequest {
	eventId: string;
	userId: string;
}

type GetCalendarEventUseCaseResponse = Either<
	| CalendarConnectionNotFoundError
	| CalendarEventNotFoundError
	| GoogleCalendarIntegrationError,
	{ event: CalendarGatewayEvent }
>;

export class GetCalendarEventUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		userId,
		eventId,
	}: GetCalendarEventUseCaseRequest): Promise<GetCalendarEventUseCaseResponse> {
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
			const event = await this.calendarGateway.getEvent(accessToken, eventId);

			if (!event) {
				return left(new CalendarEventNotFoundError(eventId));
			}

			return right({ event });
		} catch {
			return left(new GoogleCalendarIntegrationError());
		}
	}
}

import type {
	CalendarGateway,
	CalendarGatewayEvent,
} from "@/infra/google/calendar-gateway";
import { type Either, left, right } from "@/utils/either";
import { ensureGoogleAccessToken } from "./ensure-google-access-token";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";
import { CalendarConnectionsRepository } from "@/instance/repositories/calendar-connections-repository";

interface FetchCalendarEventsUseCaseRequest {
	maxResults?: number;
	timeMax?: Date;
	timeMin?: Date;
	userId: string;
}

type FetchCalendarEventsUseCaseResponse = Either<
	CalendarConnectionNotFoundError | GoogleCalendarIntegrationError,
	{ events: CalendarGatewayEvent[] }
>;

export class FetchCalendarEventsUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository,
		private readonly calendarGateway: CalendarGateway
	) {}

	async execute({
		userId,
		timeMin,
		timeMax,
		maxResults,
	}: FetchCalendarEventsUseCaseRequest): Promise<FetchCalendarEventsUseCaseResponse> {
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
			const events = await this.calendarGateway.listEvents({
				accessToken,
				timeMin,
				timeMax,
				maxResults,
			});

			return right({ events });
		} catch {
			return left(new GoogleCalendarIntegrationError());
		}
	}
}

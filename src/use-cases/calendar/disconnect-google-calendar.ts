import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import { type Either, left, right } from "@/utils/either";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";

interface DisconnectGoogleCalendarUseCaseRequest {
	userId: string;
}

type DisconnectGoogleCalendarUseCaseResponse = Either<
	CalendarConnectionNotFoundError,
	null
>;

export class DisconnectGoogleCalendarUseCase {
	constructor(
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository
	) {}

	async execute({
		userId,
	}: DisconnectGoogleCalendarUseCaseRequest): Promise<DisconnectGoogleCalendarUseCaseResponse> {
		const connection = await this.calendarConnectionsRepository.findByUserId(userId);

		if (!connection) {
			return left(new CalendarConnectionNotFoundError(userId));
		}

		await this.calendarConnectionsRepository.deleteByUserId(userId);

		return right(null);
	}
}

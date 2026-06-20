export class CalendarConnectionNotFoundError extends Error {
	constructor(userId: string) {
		super(`Google Calendar is not connected for user "${userId}".`);
	}
}

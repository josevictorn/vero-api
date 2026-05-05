export class CalendarEventNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Calendar event "${identifier}" not found.`);
	}
}

export class GoogleCalendarIntegrationError extends Error {
	constructor(message = "Google Calendar integration failed.") {
		super(message);
	}
}

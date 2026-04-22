export interface GoogleTokenPayload {
	accessToken: string;
	expiresAt: Date;
	refreshToken?: string;
}

export interface GoogleProfile {
	email: string;
}

export interface CalendarGatewayEvent {
	description: string | null;
	endsAt: Date;
	hangoutLink: string | null;
	id: string;
	startsAt: Date;
	summary: string;
}

export interface ListGoogleEventsInput {
	accessToken: string;
	maxResults?: number;
	timeMax?: Date;
	timeMin?: Date;
}

export interface CreateGoogleEventInput {
	accessToken: string;
	description?: string;
	endsAt: Date;
	startsAt: Date;
	summary: string;
	timeZone?: string;
}

export interface UpdateGoogleEventInput {
	accessToken: string;
	description?: string;
	endsAt?: Date;
	eventId: string;
	startsAt?: Date;
	summary?: string;
	timeZone?: string;
}

export interface CalendarGateway {
	createEventWithMeet(
		input: CreateGoogleEventInput
	): Promise<CalendarGatewayEvent>;
	deleteEvent(accessToken: string, eventId: string): Promise<void>;
	exchangeCodeForTokens(code: string): Promise<GoogleTokenPayload>;
	getAuthUrl(state: string): string;
	getEvent(
		accessToken: string,
		eventId: string
	): Promise<CalendarGatewayEvent | null>;
	getProfile(accessToken: string): Promise<GoogleProfile>;
	listEvents(input: ListGoogleEventsInput): Promise<CalendarGatewayEvent[]>;
	refreshAccessToken(refreshToken: string): Promise<GoogleTokenPayload>;
	updateEvent(
		input: UpdateGoogleEventInput
	): Promise<CalendarGatewayEvent | null>;
}

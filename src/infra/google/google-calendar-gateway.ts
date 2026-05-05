import { randomUUID } from "node:crypto";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import { env } from "@/env";
import type {
	CalendarGateway,
	CalendarGatewayEvent,
	CreateGoogleEventInput,
	GoogleProfile,
	GoogleTokenPayload,
	ListGoogleEventsInput,
	UpdateGoogleEventInput,
} from "./calendar-gateway";

const DEFAULT_MAX_RESULTS = 20;

export class GoogleCalendarGateway implements CalendarGateway {
	private readonly oauthClient = new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.GOOGLE_OAUTH_REDIRECT_URI
	);

	getAuthUrl(state: string) {
		return this.oauthClient.generateAuthUrl({
			access_type: "offline",
			prompt: "consent",
			scope: [
				"https://www.googleapis.com/auth/calendar",
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/drive",
				"https://www.googleapis.com/auth/documents",
			],
			state,
		});
	}

	async exchangeCodeForTokens(code: string): Promise<GoogleTokenPayload> {
		const { tokens } = await this.oauthClient.getToken(code);

		if (!tokens.access_token) {
			throw new Error("Google OAuth token exchange failed.");
		}

		if (!tokens.expiry_date) {
			throw new Error("Google OAuth token exchange failed.");
		}

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? undefined,
			expiresAt: new Date(tokens.expiry_date),
		};
	}

	async refreshAccessToken(refreshToken: string): Promise<GoogleTokenPayload> {
		this.oauthClient.setCredentials({ refresh_token: refreshToken });
		const { credentials } = await this.oauthClient.refreshAccessToken();

		if (!credentials.access_token) {
			throw new Error("Google OAuth token refresh failed.");
		}

		if (!credentials.expiry_date) {
			throw new Error("Google OAuth token refresh failed.");
		}

		return {
			accessToken: credentials.access_token,
			refreshToken: credentials.refresh_token ?? refreshToken,
			expiresAt: new Date(credentials.expiry_date),
		};
	}

	async getProfile(accessToken: string): Promise<GoogleProfile> {
		const oauth2 = google.oauth2({ version: "v2" });
		const response = await oauth2.userinfo.get({
			oauth_token: accessToken,
		});

		if (!response.data.email) {
			throw new Error("Google account email not found.");
		}

		return { email: response.data.email };
	}

	async listEvents(
		input: ListGoogleEventsInput
	): Promise<CalendarGatewayEvent[]> {
		const calendar = this.getCalendarClient(input.accessToken);
		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: input.timeMin?.toISOString(),
			timeMax: input.timeMax?.toISOString(),
			maxResults: input.maxResults ?? DEFAULT_MAX_RESULTS,
			singleEvents: true,
			orderBy: "startTime",
		});

		const items = response.data.items ?? [];

		return items
			.filter((item): item is calendar_v3.Schema$Event => Boolean(item.id))
			.map((item) => this.toGatewayEvent(item));
	}

	async getEvent(accessToken: string, eventId: string) {
		const calendar = this.getCalendarClient(accessToken);

		try {
			const response = await calendar.events.get({
				calendarId: "primary",
				eventId,
			});

			if (!response.data.id) {
				return null;
			}

			return this.toGatewayEvent(response.data);
		} catch {
			return null;
		}
	}

	async createEventWithMeet(
		input: CreateGoogleEventInput
	): Promise<CalendarGatewayEvent> {
		const calendar = this.getCalendarClient(input.accessToken);
		const response = await calendar.events.insert({
			calendarId: "primary",
			conferenceDataVersion: 1,
			requestBody: {
				summary: input.summary,
				description: input.description,
				start: {
					dateTime: input.startsAt.toISOString(),
					timeZone: input.timeZone,
				},
				end: {
					dateTime: input.endsAt.toISOString(),
					timeZone: input.timeZone,
				},
				conferenceData: {
					createRequest: {
						requestId: randomUUID(),
					},
				},
			},
		});

		if (!response.data.id) {
			throw new Error("Google Calendar event creation failed.");
		}

		return this.toGatewayEvent(response.data);
	}

	async updateEvent(input: UpdateGoogleEventInput) {
		const calendar = this.getCalendarClient(input.accessToken);

		try {
			const response = await calendar.events.patch({
				calendarId: "primary",
				eventId: input.eventId,
				requestBody: {
					summary: input.summary,
					description: input.description,
					start: input.startsAt
						? {
								dateTime: input.startsAt.toISOString(),
								timeZone: input.timeZone,
							}
						: undefined,
					end: input.endsAt
						? {
								dateTime: input.endsAt.toISOString(),
								timeZone: input.timeZone,
							}
						: undefined,
				},
			});

			if (!response.data.id) {
				return null;
			}

			return this.toGatewayEvent(response.data);
		} catch {
			return null;
		}
	}

	async deleteEvent(accessToken: string, eventId: string) {
		const calendar = this.getCalendarClient(accessToken);
		await calendar.events.delete({
			calendarId: "primary",
			eventId,
		});
	}

	private getCalendarClient(accessToken: string) {
		const client = new google.auth.OAuth2(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			env.GOOGLE_OAUTH_REDIRECT_URI
		);
		client.setCredentials({ access_token: accessToken });

		return google.calendar({ version: "v3", auth: client });
	}

	private toGatewayEvent(
		event: calendar_v3.Schema$Event
	): CalendarGatewayEvent {
		if (!event.id) {
			throw new Error("Invalid Google Calendar event payload.");
		}

		if (!event.start?.dateTime) {
			throw new Error("Invalid Google Calendar event payload.");
		}

		if (!event.end?.dateTime) {
			throw new Error("Invalid Google Calendar event payload.");
		}

		return {
			id: event.id,
			summary: event.summary ?? "",
			description: event.description ?? null,
			startsAt: new Date(event.start.dateTime),
			endsAt: new Date(event.end.dateTime),
			hangoutLink: event.hangoutLink ?? null,
		};
	}
}

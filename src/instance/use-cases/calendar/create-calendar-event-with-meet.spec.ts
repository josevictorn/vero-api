import { describe, expect, it } from "vitest";
import { InMemoryCalendarConnectionsRepository } from "@/repositories/in-memory/in-memory-calendar-connections-repository";
import { InMemoryCalendarEventsRepository } from "@/repositories/in-memory/in-memory-calendar-events-repository";
import { CreateCalendarEventWithMeetUseCase } from "./create-calendar-event-with-meet";
import { CalendarConnectionNotFoundError } from "./errors/calendar-connection-not-found-error";

const ONE_MINUTE_IN_MS = 60_000;

class FakeCalendarGateway {
	getAuthUrl() {
		return "";
	}

	async exchangeCodeForTokens() {
		return {
			accessToken: "access-token",
			refreshToken: "refresh-token",
			expiresAt: new Date(Date.now() + ONE_MINUTE_IN_MS),
		};
	}

	async refreshAccessToken() {
		return {
			accessToken: "access-token",
			refreshToken: "refresh-token",
			expiresAt: new Date(Date.now() + ONE_MINUTE_IN_MS),
		};
	}

	async getProfile() {
		return { email: "jane@google.com" };
	}

	async listEvents() {
		return [];
	}

	async getEvent() {
		return null;
	}

	async createEventWithMeet() {
		return {
			id: "event-1",
			summary: "Meeting",
			description: null,
			startsAt: new Date("2026-04-25T10:00:00.000Z"),
			endsAt: new Date("2026-04-25T11:00:00.000Z"),
			hangoutLink: "https://meet.google.com/abc-defg-hij",
		};
	}

	async updateEvent() {
		return null;
	}

	async deleteEvent() {
		return;
	}
}

describe("Create Calendar Event With Meet Use Case", () => {
	it("should return error when user has no google connection", async () => {
		const sut = new CreateCalendarEventWithMeetUseCase(
			new InMemoryCalendarConnectionsRepository(),
			new InMemoryCalendarEventsRepository(),
			new FakeCalendarGateway()
		);

		const result = await sut.execute({
			userId: "missing-user",
			summary: "Meeting",
			startsAt: new Date("2026-04-25T10:00:00.000Z"),
			endsAt: new Date("2026-04-25T11:00:00.000Z"),
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(CalendarConnectionNotFoundError);
	});
});

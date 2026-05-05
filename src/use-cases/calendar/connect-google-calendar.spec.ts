import { describe, expect, it } from "vitest";
import { GoogleOAuthStateSigner } from "@/infra/google/google-oauth-state";
import { InMemoryCalendarConnectionsRepository } from "@/repositories/in-memory/in-memory-calendar-connections-repository";
import { ConnectGoogleCalendarUseCase } from "./connect-google-calendar";
import { InvalidOAuthStateError } from "./errors/invalid-oauth-state-error";

const ONE_MINUTE_IN_MS = 60_000;
const TEST_STATE_SECRET = "test-secret";

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
			hangoutLink: "https://meet.google.com/test-link",
		};
	}

	async updateEvent() {
		return null;
	}

	async deleteEvent() {
		return;
	}
}

describe("Connect Google Calendar Use Case", () => {
	it("should return error when state is invalid", async () => {
		const oauthStateSigner = new GoogleOAuthStateSigner(TEST_STATE_SECRET);
		const sut = new ConnectGoogleCalendarUseCase(
			oauthStateSigner,
			new FakeCalendarGateway(),
			new InMemoryCalendarConnectionsRepository()
		);

		const result = await sut.execute({
			code: "code",
			state: "invalid-state-token",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidOAuthStateError);
	});

	it("should connect google calendar with valid state", async () => {
		const oauthStateSigner = new GoogleOAuthStateSigner(TEST_STATE_SECRET);
		const validState = oauthStateSigner.sign({ userId: "user-1" });
		const sut = new ConnectGoogleCalendarUseCase(
			oauthStateSigner,
			new FakeCalendarGateway(),
			new InMemoryCalendarConnectionsRepository()
		);

		const result = await sut.execute({
			code: "code",
			state: validState,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.connection.googleEmail).toBe("jane@google.com");
		}
	});
});

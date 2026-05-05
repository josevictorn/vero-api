import type { GoogleCalendarConnection } from "@generated/prisma/client";
import type { CalendarGateway } from "@/infra/google/calendar-gateway";
import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";

const ONE_MINUTE_IN_MS = 60_000;
const ACCESS_TOKEN_SAFE_WINDOW_MS = ONE_MINUTE_IN_MS;

interface EnsureGoogleAccessTokenRequest {
	calendarConnectionsRepository: CalendarConnectionsRepository;
	calendarGateway: CalendarGateway;
	connection: GoogleCalendarConnection;
}

export async function ensureGoogleAccessToken({
	connection,
	calendarGateway,
	calendarConnectionsRepository,
}: EnsureGoogleAccessTokenRequest): Promise<string> {
	const expiresSoon =
		connection.tokenExpiresAt.getTime() - Date.now() <=
		ACCESS_TOKEN_SAFE_WINDOW_MS;

	if (!expiresSoon) {
		return connection.accessToken;
	}

	const refreshedTokens = await calendarGateway.refreshAccessToken(
		connection.refreshToken
	);

	await calendarConnectionsRepository.upsertByUserId(connection.userId, {
		id: connection.id,
		userId: connection.userId,
		googleEmail: connection.googleEmail,
		accessToken: refreshedTokens.accessToken,
		refreshToken: refreshedTokens.refreshToken ?? connection.refreshToken,
		tokenExpiresAt: refreshedTokens.expiresAt,
	});

	return refreshedTokens.accessToken;
}

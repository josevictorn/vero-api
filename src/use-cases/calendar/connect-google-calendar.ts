import type { GoogleCalendarConnection } from "@generated/prisma/client";
import type { CalendarGateway } from "@/infra/google/calendar-gateway";
import type { GoogleOAuthStateSigner } from "@/infra/google/google-oauth-state";
import type { CalendarConnectionsRepository } from "@/repositories/calendar-connections-repository";
import { type Either, left, right } from "@/utils/either";
import { GoogleCalendarIntegrationError } from "./errors/google-calendar-integration-error";
import { InvalidOAuthStateError } from "./errors/invalid-oauth-state-error";

interface ConnectGoogleCalendarUseCaseRequest {
	code: string;
	state: string;
}

type ConnectGoogleCalendarUseCaseResponse = Either<
	InvalidOAuthStateError | GoogleCalendarIntegrationError,
	{ connection: GoogleCalendarConnection }
>;

export class ConnectGoogleCalendarUseCase {
	constructor(
		private readonly oauthStateSigner: GoogleOAuthStateSigner,
		private readonly calendarGateway: CalendarGateway,
		private readonly calendarConnectionsRepository: CalendarConnectionsRepository
	) {}

	async execute({
		code,
		state,
	}: ConnectGoogleCalendarUseCaseRequest): Promise<ConnectGoogleCalendarUseCaseResponse> {
		const payload = this.oauthStateSigner.verify(state);

		if (!payload) {
			return left(new InvalidOAuthStateError());
		}

		try {
			const tokens = await this.calendarGateway.exchangeCodeForTokens(code);
			const profile = await this.calendarGateway.getProfile(tokens.accessToken);
			const connection = await this.calendarConnectionsRepository.upsertByUserId(
				payload.userId,
				{
					userId: payload.userId,
					googleEmail: profile.email,
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken ?? "",
					tokenExpiresAt: tokens.expiresAt,
				}
			);

			return right({ connection });
		} catch {
			return left(new GoogleCalendarIntegrationError());
		}
	}
}

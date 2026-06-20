import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { makeGoogleOAuthStateSigner } from "@/infra/google/make-google-oauth-state-signer";
import { PrismaCalendarConnectionsRepository } from "@/repositories/prisma/prisma-calendar-connections-repository";
import { ConnectGoogleCalendarUseCase } from "../connect-google-calendar";

export function makeConnectGoogleCalendarUseCase() {
	const oauthStateSigner = makeGoogleOAuthStateSigner();
	const calendarGateway = makeGoogleCalendarGateway();
	const calendarConnectionsRepository = new PrismaCalendarConnectionsRepository();

	return new ConnectGoogleCalendarUseCase(
		oauthStateSigner,
		calendarGateway,
		calendarConnectionsRepository
	);
}

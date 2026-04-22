import { makeGoogleCalendarGateway } from "@/infra/google/make-google-calendar-gateway";
import { makeGoogleOAuthStateSigner } from "@/infra/google/make-google-oauth-state-signer";
import { GenerateGoogleAuthUrlUseCase } from "../generate-google-auth-url";

export function makeGenerateGoogleAuthUrlUseCase() {
	const calendarGateway = makeGoogleCalendarGateway();
	const oauthStateSigner = makeGoogleOAuthStateSigner();

	return new GenerateGoogleAuthUrlUseCase(calendarGateway, oauthStateSigner);
}

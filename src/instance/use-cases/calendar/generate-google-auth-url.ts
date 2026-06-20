import type { CalendarGateway } from "@/infra/google/calendar-gateway";
import type { GoogleOAuthStateSigner } from "@/infra/google/google-oauth-state";
import { type Either, right } from "@/utils/either";

interface GenerateGoogleAuthUrlUseCaseRequest {
	userId: string;
}

type GenerateGoogleAuthUrlUseCaseResponse = Either<never, { authUrl: string }>;

export class GenerateGoogleAuthUrlUseCase {
	constructor(
		private readonly calendarGateway: CalendarGateway,
		private readonly oauthStateSigner: GoogleOAuthStateSigner
	) {}

	async execute({
		userId,
	}: GenerateGoogleAuthUrlUseCaseRequest): Promise<GenerateGoogleAuthUrlUseCaseResponse> {
		const state = this.oauthStateSigner.sign({ userId });
		const authUrl = this.calendarGateway.getAuthUrl(state);

		return right({ authUrl });
	}
}

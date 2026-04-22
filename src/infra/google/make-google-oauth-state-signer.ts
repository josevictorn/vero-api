import { env } from "@/env";
import { GoogleOAuthStateSigner } from "./google-oauth-state";

export function makeGoogleOAuthStateSigner() {
	return new GoogleOAuthStateSigner(env.GOOGLE_OAUTH_STATE_SECRET);
}

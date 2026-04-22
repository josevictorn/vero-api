import { createHmac, timingSafeEqual } from "node:crypto";

const ONE_MINUTE_IN_MS = 60_000;
const STATE_TTL_MINUTES = 10;
const STATE_TTL_MS = ONE_MINUTE_IN_MS * STATE_TTL_MINUTES;

interface GoogleOAuthStatePayload {
	expiresAt: number;
	userId: string;
}

export class GoogleOAuthStateSigner {
	constructor(private readonly secret: string) {}

	sign(payload: { userId: string }) {
		const data: GoogleOAuthStatePayload = {
			userId: payload.userId,
			expiresAt: Date.now() + STATE_TTL_MS,
		};

		const jsonPayload = JSON.stringify(data);
		const encodedPayload = Buffer.from(jsonPayload, "utf8").toString(
			"base64url"
		);
		const signature = this.createSignature(encodedPayload);

		return `${encodedPayload}.${signature}`;
	}

	verify(state: string): { userId: string } | null {
		const [encodedPayload, signature] = state.split(".");

		if (!encodedPayload) {
			return null;
		}

		if (!signature) {
			return null;
		}

		const expectedSignature = this.createSignature(encodedPayload);
		const signatureMatches = timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expectedSignature)
		);

		if (!signatureMatches) {
			return null;
		}

		const payloadRaw = Buffer.from(encodedPayload, "base64url").toString(
			"utf8"
		);
		const payload = JSON.parse(payloadRaw) as GoogleOAuthStatePayload;

		if (!payload.userId || payload.expiresAt < Date.now()) {
			return null;
		}

		return { userId: payload.userId };
	}

	private createSignature(data: string) {
		return createHmac("sha256", this.secret).update(data).digest("base64url");
	}
}

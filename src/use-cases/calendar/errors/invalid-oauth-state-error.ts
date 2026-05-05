export class InvalidOAuthStateError extends Error {
	constructor() {
		super("Invalid or expired OAuth state.");
	}
}

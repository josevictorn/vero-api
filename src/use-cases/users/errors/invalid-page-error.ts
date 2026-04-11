export class InvalidPageError extends Error {
	constructor() {
		super("Invalid page number.");
	}
}

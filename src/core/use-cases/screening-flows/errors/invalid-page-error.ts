export class InvalidPageError extends Error {
	constructor() {
		super("Page must be greater than or equal to 1.");
	}
}

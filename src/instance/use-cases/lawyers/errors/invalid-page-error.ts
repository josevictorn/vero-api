export class InvalidPageError extends Error {
	constructor() {
		super("Page number must be greater than 0.");
	}
}

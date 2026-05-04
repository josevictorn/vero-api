export class GoogleDocsIntegrationError extends Error {
	constructor(message: string) {
		super(`Google Docs integration failed with message: ${message}`);
	}
}

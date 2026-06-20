export class AiSessionNotFoundError extends Error {
	constructor(identifier: string) {
		super(`AI Session "${identifier}" not found.`);
	}
}

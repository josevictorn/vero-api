export class ClientNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Client "${identifier}" not found.`);
	}
}

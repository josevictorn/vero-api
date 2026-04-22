export class UserNotFoundError extends Error {
	constructor(identifier: string) {
		super(`User "${identifier}" not found.`);
	}
}

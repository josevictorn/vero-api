export class LeadNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Lead "${identifier}" not found.`);
	}
}

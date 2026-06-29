export class DomainEntityNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Domain entity "${identifier}" not found.`);
	}
}

export class LawyerNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Lawyer "${identifier}" not found.`);
	}
}

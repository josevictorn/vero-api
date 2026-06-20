export class ScreeningFlowNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Screening flow "${identifier}" not found.`);
	}
}

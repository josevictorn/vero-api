export class ScreeningFlowNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Screening Flow "${identifier}" not found.`);
	}
}

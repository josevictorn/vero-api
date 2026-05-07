export class ScreeningFlowNotFoundError extends Error {
	constructor() {
		super("Screening flow not found for this AI session.");
		this.name = "ScreeningFlowNotFoundError";
	}
}

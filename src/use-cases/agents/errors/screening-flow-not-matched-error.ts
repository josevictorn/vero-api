export class ScreeningFlowNotMatchedError extends Error {
	constructor(category: string) {
		super(`No screening flow found matching the identified category: "${category}".`);
		this.name = "ScreeningFlowNotMatchedError";
	}
}

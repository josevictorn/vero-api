export class ScreeningReportNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Screening report "${identifier}" not found.`);
		this.name = "ScreeningReportNotFoundError";
	}
}

export class UnknownStatusError extends Error {
	constructor() {
		super("Lead status does not exists.");
	}
}

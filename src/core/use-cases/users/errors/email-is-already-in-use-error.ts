export class EmailIsAlreadyInUseError extends Error {
	constructor(email: string) {
		super(`The email "${email}" is already in use.`);
	}
}

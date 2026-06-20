export class LawyerAlreadyExistsError extends Error {
	constructor(userId: string) {
		super(`A lawyer already exists for user "${userId}".`);
	}
}

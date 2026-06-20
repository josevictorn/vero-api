export class WorkspaceNotFoundError extends Error {
	constructor(identifier: string) {
		super(`Workspace "${identifier}" not found.`);
	}
}

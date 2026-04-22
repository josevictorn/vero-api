export class WorkspaceNotConfiguredError extends Error {
	constructor() {
		super("No workspace found. Please configure a workspace before using AI agents.");
		this.name = "WorkspaceNotConfiguredError";
	}
}

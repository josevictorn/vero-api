export class AgentResponseError extends Error {
	constructor(agentName: string, details: string) {
		super(`Agent "${agentName}" returned an invalid response: ${details}`);
		this.name = "AgentResponseError";
	}
}

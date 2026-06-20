export class LeadAlreadyConvertedError extends Error {
  constructor(leadId: string) {
	  super(`Lead with id ${leadId} is already converted`)
	}
}

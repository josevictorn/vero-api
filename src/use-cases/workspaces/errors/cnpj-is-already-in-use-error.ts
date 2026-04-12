export class CnpjIsAlreadyInUseError extends Error {
	constructor(cnpj: string) {
		super(`The CNPJ "${cnpj}" is already in use.`);
	}
}

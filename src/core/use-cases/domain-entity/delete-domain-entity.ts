import { type Either, left, right } from "@/utils/either";
import type { DomainEntityPort } from "@/core/ports/domain-entity.port";
import { DomainEntityNotFoundError } from "./errors/domain-entity-not-found-error";

interface DeleteDomainEntityUseCaseRequest {
	id: string;
}

type DeleteDomainEntityUseCaseResponse = Either<DomainEntityNotFoundError, void>;

export class DeleteDomainEntityUseCase {
	constructor(private readonly port: DomainEntityPort) {}

	async execute({
		id,
	}: DeleteDomainEntityUseCaseRequest): Promise<DeleteDomainEntityUseCaseResponse> {
		const existing = await this.port.findById(id);

		if (!existing) {
			return left(new DomainEntityNotFoundError(id));
		}

		await this.port.delete(id);

		return right(undefined);
	}
}

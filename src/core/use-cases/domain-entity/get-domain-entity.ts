import { type Either, left, right } from "@/utils/either";
import type { DomainEntity, DomainEntityPort } from "@/core/ports/domain-entity.port";
import { DomainEntityNotFoundError } from "./errors/domain-entity-not-found-error";

interface GetDomainEntityUseCaseRequest {
	id: string;
}

type GetDomainEntityUseCaseResponse = Either<
	DomainEntityNotFoundError,
	{ entity: DomainEntity }
>;

export class GetDomainEntityUseCase {
	constructor(private readonly port: DomainEntityPort) {}

	async execute({
		id,
	}: GetDomainEntityUseCaseRequest): Promise<GetDomainEntityUseCaseResponse> {
		const entity = await this.port.findById(id);

		if (!entity) {
			return left(new DomainEntityNotFoundError(id));
		}

		return right({ entity });
	}
}

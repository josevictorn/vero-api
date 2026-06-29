import { type Either, left, right } from "@/utils/either";
import type { DomainEntity, DomainEntityPort } from "@/core/ports/domain-entity.port";
import { DomainEntityNotFoundError } from "./errors/domain-entity-not-found-error";

interface UpdateDomainEntityUseCaseRequest {
	id: string;
	data: Record<string, unknown>;
}

type UpdateDomainEntityUseCaseResponse = Either<
	DomainEntityNotFoundError | Error,
	{ entity: DomainEntity }
>;

export class UpdateDomainEntityUseCase {
	constructor(private readonly port: DomainEntityPort) {}

	async execute({
		id,
		data,
	}: UpdateDomainEntityUseCaseRequest): Promise<UpdateDomainEntityUseCaseResponse> {
		const existing = await this.port.findById(id);

		if (!existing) {
			return left(new DomainEntityNotFoundError(id));
		}

		const result = await this.port.update(id, data);

		if (result.isLeft()) {
			return left(result.value);
		}

		return right({ entity: result.value.entity });
	}
}

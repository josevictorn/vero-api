import type { LawyersRepository } from "@/repositories/lawyers-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";

interface DeleteLawyerUseCaseRequest {
	lawyerId: string;
}

type DeleteLawyerUseCaseResponse = Either<LawyerNotFoundError, null>;

export class DeleteLawyerUseCase {
	constructor(private readonly lawyersRepository: LawyersRepository) {}

	async execute({
		lawyerId,
	}: DeleteLawyerUseCaseRequest): Promise<DeleteLawyerUseCaseResponse> {
		const lawyer = await this.lawyersRepository.findById(lawyerId);

		if (!lawyer) {
			return left(new LawyerNotFoundError(lawyerId));
		}

		await this.lawyersRepository.delete(lawyerId);

		return right(null);
	}
}

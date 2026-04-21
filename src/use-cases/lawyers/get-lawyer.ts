import type { Lawyer } from "@generated/prisma/client";
import type { LawyersRepository } from "@/repositories/lawyers-repository";
import { type Either, left, right } from "@/utils/either";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";

interface GetLawyerUseCaseRequest {
	lawyerId: string;
}

type GetLawyerUseCaseResponse = Either<LawyerNotFoundError, { lawyer: Lawyer }>;

export class GetLawyerUseCase {
	constructor(private readonly lawyersRepository: LawyersRepository) {}

	async execute({
		lawyerId,
	}: GetLawyerUseCaseRequest): Promise<GetLawyerUseCaseResponse> {
		const lawyer = await this.lawyersRepository.findById(lawyerId);

		if (!lawyer) {
			return left(new LawyerNotFoundError(lawyerId));
		}

		return right({
			lawyer,
		});
	}
}

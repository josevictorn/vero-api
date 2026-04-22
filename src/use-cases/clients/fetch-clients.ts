import { type Either, left, right } from "@/utils/either";
import { InvalidPageError } from "../users/errors/invalid-page-error";
import { Client } from "@generated/prisma/client";
import { ClientsRepository } from "@/repositories/clients-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";

interface FetchClientsUseCaseRequest {
    page: number;
}

type FetchClientsUseCaseResponse = Either<
    InvalidPageError,
    {
        results: Client[];
        meta: {
            currentPage: number;
            totalCount: number;
            perPage: number;
        };
    }
>;

export class FetchClientsUseCase {
    constructor(private readonly clientsRepository: ClientsRepository) {}

    async execute({
        page
    }: FetchClientsUseCaseRequest): Promise<FetchClientsUseCaseResponse> {
        if (page < 1) {
            return left(new InvalidPageError());
        }

        const clients = await this.clientsRepository.findMany({ page });

        return right({
            results: clients.items,
            meta: {
                currentPage: page,
                totalCount: clients.total,
                perPage: ITEM_PER_PAGE,
            },
        });
    }
}

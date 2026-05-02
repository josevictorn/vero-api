import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InvalidPageError } from "./errors/invalid-page-error";
import { FetchLawyersUseCase } from "./fetch-lawyers";

let lawyersRepository: InMemoryLawyersRepository;
let sut: FetchLawyersUseCase;

describe("Fetch Lawyers Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		sut = new FetchLawyersUseCase(lawyersRepository);
	});

	it("should be able to fetch lawyers", async () => {
		const lawyer1 = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const lawyer2 = await lawyersRepository.create({
			userId: "user-2",
			workspaceId: "workspace-1",
			cellphone: "11999996666",
			name: "João Silva",
			oab: "OAB12378",
			oabState: "SP",
			pix: "pix2@example.com",
		});

		const result = await sut.execute({ page: 1 });

		expect(result.isRight()).toBe(true);
		expect(result.value).toEqual({
			results: expect.arrayContaining([
				expect.objectContaining({ id: lawyer1.id, userId: lawyer1.userId }),
				expect.objectContaining({ id: lawyer2.id, userId: lawyer2.userId }),
			]),
			meta: {
				currentPage: 1,
				totalCount: 2,
				perPage: 20,
			},
		});
	});

	it("should not be able to fetch with invalid page", async () => {
		const result = await sut.execute({ page: 0 });

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidPageError);
	});
});

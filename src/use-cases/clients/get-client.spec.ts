import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { ClientNotFoundError } from "./errors/client-not-found-error";
import { GetClientUseCase } from "./get-clients";

let clientsRepository: InMemoryClientsRepository;
let sut: GetClientUseCase;

describe("Get Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		sut = new GetClientUseCase(clientsRepository);
	});

	it("should be able to get a client by id", async () => {
		const client = await clientsRepository.create({
			name: "João",
			email: "joao@test.com",
			cellphone: "84999999999",
			workspaceId: "workspace-1",
			lawyerId: null,
		});

		const result = await sut.execute({
			clientId: client.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client.id).toBe(client.id);
			expect(result.value.client.name).toBe("João");
			expect(result.value.client.email).toBe("joao@test.com");
			expect(result.value.client.cellphone).toBe("84999999999");
			expect(result.value.client.workspaceId).toBe("workspace-1");
		}
	});

	it("should not be able to get a non-existing client", async () => {
		const result = await sut.execute({
			clientId: "non-existing-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ClientNotFoundError);
	});

	it("should return the exact stored client (no mutation)", async () => {
		const client = await clientsRepository.create({
			name: "Maria",
			email: "maria@test.com",
			cellphone: "84988888888",
			workspaceId: "workspace-1",
			lawyerId: "lawyer-1",
		});

		const result = await sut.execute({
			clientId: client.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.client).toEqual(client);
		}
	});
});

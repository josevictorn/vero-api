import { describe, it, expect, beforeEach } from "vitest";
import { DeleteClientUseCase } from "./delete-client";
import { InMemoryClientsRepository } from "@/repositories/in-memory/in-memory-clients-repository";
import { ClientNotFoundError } from "./errors/client-not-found-error";

let clientsRepository: InMemoryClientsRepository;
let sut: DeleteClientUseCase;

describe("Delete Client Use Case", () => {
	beforeEach(() => {
		clientsRepository = new InMemoryClientsRepository();
		sut = new DeleteClientUseCase(clientsRepository);
	});

	it("should be able to delete a client", async () => {
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

		const deletedClient = await clientsRepository.findById(client.id);
		expect(deletedClient).toBeNull();
	});

	it("should not be able to delete a non-existing client", async () => {
		const result = await sut.execute({
			clientId: "non-existing-id",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(ClientNotFoundError);
	});
});

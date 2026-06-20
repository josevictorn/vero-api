import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLawyersRepository } from "@/repositories/in-memory/in-memory-lawyers-repository";
import { InMemoryUsersRepository } from "@/core/repositories/in-memory/in-memory-users-repository";
import { InMemoryWorkspacesRepository } from "@/core/repositories/in-memory/in-memory-workspaces-repository";
import { EditLawyerUseCase } from "./edit-lawyer";
import { LawyerAlreadyExistsError } from "./errors/lawyer-already-exists-error";
import { LawyerNotFoundError } from "./errors/lawyer-not-found-error";
import { UserNotFoundError } from "./errors/user-not-found-error";
import { WorkspaceNotFoundError } from "./errors/workspace-not-found-error";

let lawyersRepository: InMemoryLawyersRepository;
let usersRepository: InMemoryUsersRepository;
let workspacesRepository: InMemoryWorkspacesRepository;
let sut: EditLawyerUseCase;

describe("Edit Lawyer Use Case", () => {
	beforeEach(() => {
		lawyersRepository = new InMemoryLawyersRepository();
		usersRepository = new InMemoryUsersRepository();
		workspacesRepository = new InMemoryWorkspacesRepository();
		sut = new EditLawyerUseCase(
			lawyersRepository,
			usersRepository,
			workspacesRepository
		);
	});

	it("should be able to edit a lawyer", async () => {
		const user = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const workspace = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const lawyer = await lawyersRepository.create({
			userId: user.id,
			workspaceId: workspace.id,
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			lawyerId: lawyer.id,
			cellphone: "11999996666",
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lawyer).toEqual(
				expect.objectContaining({
					id: lawyer.id,
					userId: user.id,
					cellphone: "11999996666",
				})
			);
		}
	});

	it("should be able to change workspace", async () => {
		const workspace1 = await workspacesRepository.create({
			name: "Escritório 1",
			cnpj: "12345678000199",
			email: "contato@w1.com",
			cellphone: "11999998888",
		});

		const workspace2 = await workspacesRepository.create({
			name: "Escritório 2",
			cnpj: "98765432000199",
			email: "contato@w2.com",
			cellphone: "11999998877",
		});

		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: workspace1.id,
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			lawyerId: lawyer.id,
			workspaceId: workspace2.id,
		});

		expect(result.isRight()).toBe(true);

		if (result.isRight()) {
			expect(result.value.lawyer.workspaceId).toBe(workspace2.id);
		}
	});

	it("should not be able to edit non-existing lawyer", async () => {
		const result = await sut.execute({
			lawyerId: "non-existing-id",
			cellphone: "11999996666",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerNotFoundError);
	});

	it("should not be able to edit with non-existing user", async () => {
		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			lawyerId: lawyer.id,
			userId: "non-existing-user",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(UserNotFoundError);
	});

	it("should not be able to edit with non-existing workspace", async () => {
		const lawyer = await lawyersRepository.create({
			userId: "user-1",
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const result = await sut.execute({
			lawyerId: lawyer.id,
			workspaceId: "non-existing-workspace",
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(WorkspaceNotFoundError);
	});

	it("should not be able to change userId to one that already has a lawyer", async () => {
		const user1 = await usersRepository.create({
			name: "João Silva",
			email: "joao@example.com",
			password_hash: "hash",
		});

		const user2 = await usersRepository.create({
			name: "Maria Santos",
			email: "maria@example.com",
			password_hash: "hash",
		});

		await lawyersRepository.create({
			userId: user1.id,
			workspaceId: "workspace-1",
			cellphone: "11999997777",
			name: "João Silva",
			oab: "OAB12345",
			oabState: "SP",
			pix: "pix@example.com",
		});

		const lawyer2 = await lawyersRepository.create({
			userId: user2.id,
			workspaceId: "workspace-1",
			cellphone: "11999996666",
			name: "Maria Santos",
			oab: "OAB12346",
			oabState: "SP",
			pix: "otherpix@example.com",
		});

		const result = await sut.execute({
			lawyerId: lawyer2.id,
			userId: user1.id,
		});

		expect(result.isLeft()).toBe(true);
		expect(result.value).toBeInstanceOf(LawyerAlreadyExistsError);
	});
});

import { randomUUID } from "node:crypto";
import type { Client, Prisma } from "@generated/prisma/client";
import type { ClientsRepository } from "@/repositories/clients-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryClientsRepository implements ClientsRepository {
	private items: Client[] = [];

	async findById(id: string): Promise<Client | null> {
		const client = this.items.find((item) => item.id === id);
		return client ?? null;
	}

	async findByLeadId(leadId: string): Promise<Client | null> {
		const client = this.items.find((item) => item.createdFromLeadId === leadId);

		return client ?? null;
	}

	async create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
		const client: Client = {
			id: randomUUID(),
			name: data.name,
			maritalStatus: data.maritalStatus,
			profession: data.profession,
			rg: data.rg,
			issuingAgency: data.issuingAgency,
			cpf: data.cpf,
			street: data.street,
			neighborhood: data.neighborhood,
			city: data.city,
			state: data.state,
			zipCode: data.zipCode,
			email: data.email,
			cellphone: data.cellphone,
			workspaceId: data.workspaceId,
			lawyerId: data.lawyerId ?? null,
			createdFromLeadId: data.createdFromLeadId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(client);

		return client;
	}

	async findMany(params: PaginationParams) {
		const start = (params.page - 1) * ITEM_PER_PAGE;
		const end = params.page * ITEM_PER_PAGE;

		const clients = this.items.slice(start, end);

		return {
			items: clients,
			total: this.items.length,
		};
	}

	async save(data: Client): Promise<Client> {
		const index = this.items.findIndex((item) => item.id === data.id);

		if (index >= 0) {
			this.items[index] = data;
		}

		return data;
	}

	async delete(id: string): Promise<void> {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

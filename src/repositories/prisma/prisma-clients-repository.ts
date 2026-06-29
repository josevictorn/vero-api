import type { Client, Prisma } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { ClientsRepository } from "@/instance/ports/clients-repository";

export class PrismaClientsRepository implements ClientsRepository {
	async findById(id: string) {
		const client = await prisma.client.findUnique({
			where: { id },
		});

		return client;
	}

	async create(data: Prisma.ClientUncheckedCreateInput) {
		const client = await prisma.client.create({
			data,
		});

		return client;
	}

	async findMany(params: PaginationParams) {
		const [clients, total] = await prisma.$transaction([
			prisma.client.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.client.count(),
		]);

		return {
			items: clients,
			total,
		};
	}

	async save(data: Client) {
		const updatedClient = await prisma.client.update({
			where: { id: data.id },
			data,
		});

		return updatedClient;
	}

	async delete(id: string) {
		await prisma.client.delete({
			where: { id },
		});
	}

	async findByLeadId(leadId: string) {
		const client = await prisma.client.findUnique({
			where: {
				createdFromLeadId: leadId,
			},
		});

		return client;
	}
}

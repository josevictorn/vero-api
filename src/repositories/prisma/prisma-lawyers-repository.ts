import type { Lawyer, Prisma } from "@generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";
import { LawyersRepository } from "@/instance/repositories/lawyers-repository";

export class PrismaLawyersRepository implements LawyersRepository {
	async findById(id: string) {
		const lawyer = await prisma.lawyer.findUnique({
			where: { id },
		});

		return lawyer;
	}

	async findByUserId(userId: string) {
		const lawyer = await prisma.lawyer.findUnique({
			where: { userId },
		});

		return lawyer;
	}

	async create(data: Prisma.LawyerUncheckedCreateInput) {
		const lawyer = await prisma.lawyer.create({
			data,
		});

		return lawyer;
	}

	async findMany(params: PaginationParams) {
		const [lawyers, total] = await prisma.$transaction([
			prisma.lawyer.findMany({
				skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.lawyer.count(),
		]);

		return {
			items: lawyers,
			total,
		};
	}

	async save(data: Lawyer) {
		const updatedLawyer = await prisma.lawyer.update({
			where: { id: data.id },
			data,
		});

		return updatedLawyer;
	}

	async delete(id: string) {
		await prisma.lawyer.delete({
			where: { id },
		});
	}
}

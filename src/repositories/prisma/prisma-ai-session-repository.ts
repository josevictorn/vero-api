import { PaginatedResult } from "@/utils/paginated-results";
import { PaginationParams } from "@/utils/pagination-params";
import { AiSession, Prisma } from "@generated/prisma/client";
import { AiSessionUncheckedCreateInput } from "@generated/prisma/models";
import { AiSessionRepository } from "../ai-session-repository";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/utils/constants";


export class PrismaAiSessionRepository implements AiSessionRepository {

    async create(data: AiSessionUncheckedCreateInput): Promise<AiSession> {
        const aiSession = await prisma.aiSession.create({
            data
        });

        return aiSession;
    }

    async delete(id: string): Promise<void> {
        await prisma.aiSession.delete({
            where : {id}
        });
    }

    async findById(id: string): Promise<AiSession | null> {
        const aiSession = await prisma.aiSession.findUnique({
            where: {id}
        });

        return aiSession;
    }

    async findMany(params: PaginationParams): Promise<PaginatedResult<AiSession>> {
        const [aiSession, total] = await prisma.$transaction([
            prisma.aiSession.findMany({
                skip: (params.page - 1) * ITEM_PER_PAGE,
				take: ITEM_PER_PAGE,
				orderBy: {
					createdAt: "desc",
				},
            }),
            prisma.aiSession.count(),
        ])

        return {
            items: aiSession,
            total
        };
    }

    async save(data: AiSession): Promise<AiSession> {
        const { id, createdAt, chatState, ...rest } = data;

        const updatedAisession = await prisma.aiSession.update({
            where: { id },
            data: {
                ...rest,
                chatState: chatState as Prisma.InputJsonValue,
            },
        });

        return updatedAisession;
    }

    async findByChatId(chatId: string): Promise<AiSession | null> {
        const aiSession = await prisma.aiSession.findFirst({
            where: {chatId}
        })

        return aiSession;
    }

}
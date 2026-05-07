import { PaginatedResult } from "@/utils/paginated-results";
import { PaginationParams } from "@/utils/pagination-params";
import { AiSession, Prisma } from "@generated/prisma/client";


export interface AiSessionRepository {
    create(data: Prisma.AiSessionUncheckedCreateInput): Promise<AiSession>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<AiSession | null>;
    findByChatId(chatId: string): Promise<AiSession | null>;
    findMany(params: PaginationParams): Promise<PaginatedResult<AiSession>>;
    save(AiSession: AiSession): Promise<AiSession>;
}
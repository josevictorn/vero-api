import { ChatMessage } from "@/core/agents/types/chat-message";
import type { ChatMemoryProvider } from "./chat-memory-provider";
import { redis } from "@/lib/redis";

export class RedisChatMemoryProvider implements ChatMemoryProvider {
	async getHistory(key: string): Promise<ChatMessage[]> {
		const data = await redis.get(key);

		if (!data) {
			return [];
		}

		return JSON.parse(data) as ChatMessage[];
	}

	async saveHistory(key: string, messages: ChatMessage[]): Promise<void> {
		await redis.set(key, JSON.stringify(messages));
	}

	async clear(key: string): Promise<void> {
		await redis.del(key);
	}
}

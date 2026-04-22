import type { ChatMessage } from "@/providers/agents/types/chat-message";
import type { ChatMemoryProvider } from "./chat-memory-provider";

export class InMemoryChatMemoryProvider implements ChatMemoryProvider {
	private store = new Map<string, ChatMessage[]>();

	async getHistory(key: string): Promise<ChatMessage[]> {
		return this.store.get(key) ?? [];
	}

	async saveHistory(key: string, messages: ChatMessage[]): Promise<void> {
		this.store.set(key, messages);
	}

	async clear(key: string): Promise<void> {
		this.store.delete(key);
	}
}

import type { ChatMessage } from "@core/agents/types/chat-message";

/**
 * Port para provedores de memória de chat.
 * Implementações: Redis, in-memory (testes), etc.
 */
export interface ChatMemoryPort {
	getHistory(key: string): Promise<ChatMessage[]>;
	saveHistory(key: string, messages: ChatMessage[]): Promise<void>;
	clear(key: string): Promise<void>;
}

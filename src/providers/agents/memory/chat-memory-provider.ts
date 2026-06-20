import { ChatMessage } from "@/core/agents/types/chat-message";

export interface ChatMemoryProvider {
	getHistory(key: string): Promise<ChatMessage[]>;
	saveHistory(key: string, messages: ChatMessage[]): Promise<void>;
	clear(key: string): Promise<void>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResult {
  reply: string;
  tokensUsed?: number;
}

export interface IProvider {
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult>;
  testKey(): Promise<{ ok: boolean; message: string }>;
}

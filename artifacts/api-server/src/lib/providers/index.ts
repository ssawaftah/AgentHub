import type { IProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { DeepSeekProvider } from "./deepseek";
import { OpenAIProvider } from "./openai";
import { ClaudeProvider } from "./claude";
import { GroqProvider } from "./groq";

export type { IProvider, ChatMessage, ChatOptions, ChatResult } from "./types";

export function getProvider(provider: string, apiKey: string): IProvider {
  switch (provider) {
    case "gemini":
      return new GeminiProvider(apiKey);
    case "deepseek":
      return new DeepSeekProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "claude":
      return new ClaudeProvider(apiKey);
    case "groq":
      return new GroqProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

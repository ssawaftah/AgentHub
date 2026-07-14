import type { IProvider, ChatMessage, ChatOptions, ChatResult } from "./types";

// DeepSeek is OpenAI-compatible
export class DeepSeekProvider implements IProvider {
  private baseUrl = "https://api.deepseek.com";

  constructor(private apiKey: string) {}

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult> {
    const msgs: { role: string; content: string }[] = [];

    if (options.systemPrompt) {
      msgs.push({ role: "system", content: options.systemPrompt });
    }
    msgs.push(...messages);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "deepseek-chat",
        messages: msgs,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };

    const reply = data.choices?.[0]?.message?.content ?? "";
    const tokensUsed = data.usage?.total_tokens;

    return { reply, tokensUsed };
  }

  async testKey(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (res.ok) return { ok: true, message: "DeepSeek key is valid" };
      return { ok: false, message: `DeepSeek returned ${res.status}` };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }
}

import type { IProvider, ChatMessage, ChatOptions, ChatResult } from "./types";

// Groq is OpenAI-compatible — free tier: 14,400 req/day, no credit card needed
export class GroqProvider implements IProvider {
  private baseUrl = "https://api.groq.com/openai/v1";

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
        model: options.model || "llama-3.3-70b-versatile",
        messages: msgs,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq error ${res.status}: ${err}`);
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
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
        }),
      });

      if (res.ok) return { ok: true, message: "Groq key is valid and has active quota" };

      const body = await res.json().catch(() => ({})) as any;
      const errMsg = body?.error?.message ?? `HTTP ${res.status}`;

      if (res.status === 401) return { ok: false, message: "Invalid Groq API key" };
      if (res.status === 429) return { ok: false, message: "Rate limit reached — try again in a moment" };
      return { ok: false, message: errMsg };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }
}

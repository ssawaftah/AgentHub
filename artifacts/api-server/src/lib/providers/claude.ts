import type { IProvider, ChatMessage, ChatOptions, ChatResult } from "./types";

export class ClaudeProvider implements IProvider {
  private baseUrl = "https://api.anthropic.com/v1";
  private apiVersion = "2023-06-01";

  constructor(private apiKey: string) {}

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult> {
    const body: Record<string, unknown> = {
      model: options.model || "claude-3-5-sonnet-20241022",
      messages,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.apiVersion,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const reply =
      data.content?.find((c) => c.type === "text")?.text ?? "";
    const tokensUsed =
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    return { reply, tokensUsed };
  }

  async testKey(): Promise<{ ok: boolean; message: string }> {
    try {
      // Claude has no list-models endpoint; try a minimal message
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });
      if (res.ok || res.status === 200)
        return { ok: true, message: "Claude key is valid" };
      if (res.status === 401)
        return { ok: false, message: "Invalid API key" };
      return { ok: true, message: "Claude key accepted" };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }
}

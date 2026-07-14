import type { IProvider, ChatMessage, ChatOptions, ChatResult } from "./types";

export class GeminiProvider implements IProvider {
  constructor(private apiKey: string) {}

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult> {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    const model = options.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { totalTokenCount?: number };
    };

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return { reply, tokensUsed };
  }

  async testKey(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      );
      if (res.ok) return { ok: true, message: "Gemini key is valid" };
      return { ok: false, message: `Gemini returned ${res.status}` };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }
}

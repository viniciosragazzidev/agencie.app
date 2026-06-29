import Groq from "groq-sdk";
import type { AiProvider, AiCompletionParams } from "./base";

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

export const groqProvider: AiProvider = {
  name: "groq",

  async complete({
    system,
    user,
    model,
    temperature,
    maxTokens,
    responseFormat,
  }: AiCompletionParams): Promise<string> {
    const client = getClient();
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    return completion.choices?.[0]?.message?.content || "";
  },
};

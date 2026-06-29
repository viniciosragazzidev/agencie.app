import OpenAI from "openai";
import type { AiProvider, AiCompletionParams } from "./base";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const openaiProvider: AiProvider = {
  name: "openai",

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

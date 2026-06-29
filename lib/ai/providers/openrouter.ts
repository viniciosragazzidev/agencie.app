import OpenAI from "openai";
import type { AiProvider, AiCompletionParams } from "./base";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY not configured. Add it to your .env.local file."
      );
    }
    _client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return _client;
}

export const openrouterProvider: AiProvider = {
  name: "openrouter",

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

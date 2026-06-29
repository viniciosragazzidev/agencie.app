import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProvider, AiCompletionParams } from "./base";

export const geminiProvider: AiProvider = {
  name: "google",

  async complete({
    system,
    user,
    model,
    temperature,
    maxTokens,
  }: AiCompletionParams): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured. Add it to your .env file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: system,
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    return result.response.text();
  },
};

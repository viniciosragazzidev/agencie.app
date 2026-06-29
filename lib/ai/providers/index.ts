import type { AiProvider } from "./base";
import { groqProvider } from "./groq";
import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import { openrouterProvider } from "./openrouter";

/**
 * Registry of all available AI providers.
 * Add new providers here as they are implemented.
 */
export const providers: Record<string, AiProvider> = {
  groq: groqProvider,
  openai: openaiProvider,
  google: geminiProvider,
  openrouter: openrouterProvider,
};

/**
 * Default models for each provider.
 */
export const defaultModels: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
  openrouter: "openai/gpt-oss-120b:free",
};

export type { AiProvider, AiCompletionParams } from "./base";

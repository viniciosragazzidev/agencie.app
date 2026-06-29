import { getAiSettings } from "./settings";
import { buildSystemPrompt, type PromptContext } from "./prompts";
import { providers, defaultModels } from "./providers";
import type { AiProvider } from "./providers/base";

export interface AiCompletionRequest {
  userId: string;
  feature: PromptContext["feature"];
  userMessage: string;
  clientName?: string;
  clientIndustry?: string;
  additionalContext?: string;
  responseFormat?: "json" | "text";
  /** Override temperature for this specific call */
  temperature?: number;
  /** Override max tokens for this specific call */
  maxTokens?: number;
}

export interface AiCompletionResponse {
  content: string;
  provider: string;
  model: string;
  parsed?: unknown;
}

/**
 * Central AI Engine — the single entry point for all AI completions.
 *
 * Flow:
 * 1. Load user's AI settings from DB
 * 2. Build the layered system prompt
 * 3. Route to primary provider
 * 4. On failure → fallback provider
 * 5. Parse JSON if requested
 */
export async function aiComplete(
  request: AiCompletionRequest
): Promise<AiCompletionResponse> {
  const settings = await getAiSettings(request.userId);

  // Build the system prompt from layers
  const systemPrompt = buildSystemPrompt({
    botName: settings.botName,
    systemPrompt: settings.systemPrompt,
    persona: settings.persona,
    guidelines: settings.guidelines,
    feature: request.feature,
    clientName: request.clientName,
    clientIndustry: request.clientIndustry,
    additionalContext: request.additionalContext,
  });

  const primaryName = settings.primaryProvider;
  const fallbackName = settings.fallbackProvider;

  const primaryProvider: AiProvider | undefined = providers[primaryName];
  const fallbackProvider: AiProvider | undefined = fallbackName
    ? providers[fallbackName]
    : undefined;

  const modelPrimary =
    settings.modelPrimary || defaultModels[primaryName] || "llama-3.3-70b-versatile";
  const modelFallback =
    settings.modelFallback ||
    (fallbackName ? defaultModels[fallbackName] : undefined);

  const temperature = request.temperature ?? settings.temperature ?? 0.7;
  const maxTokens = request.maxTokens ?? settings.maxTokens ?? 2048;

  // Try primary provider
  if (primaryProvider) {
    try {
      const content = await primaryProvider.complete({
        system: systemPrompt,
        user: request.userMessage,
        model: modelPrimary,
        temperature,
        maxTokens,
        responseFormat: request.responseFormat,
      });

      return {
        content,
        provider: primaryName,
        model: modelPrimary,
        parsed: tryParseJson(content, request.responseFormat),
      };
    } catch (primaryError) {
      console.error(
        `[AI Engine] Primary provider (${primaryName}) failed:`,
        primaryError
      );
    }
  }

  // Fallback
  if (fallbackProvider && modelFallback) {
    try {
      const content = await fallbackProvider.complete({
        system: systemPrompt,
        user: request.userMessage,
        model: modelFallback,
        temperature,
        maxTokens,
        responseFormat: request.responseFormat,
      });

      return {
        content,
        provider: fallbackName!,
        model: modelFallback,
        parsed: tryParseJson(content, request.responseFormat),
      };
    } catch (fallbackError) {
      console.error(
        `[AI Engine] Fallback provider (${fallbackName}) also failed:`,
        fallbackError
      );
    }
  }

  throw new Error(
    "Todos os provedores de IA falharam. Verifique suas chaves de API configuradas."
  );
}

function tryParseJson(
  content: string,
  format?: string
): unknown | undefined {
  if (format !== "json") return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

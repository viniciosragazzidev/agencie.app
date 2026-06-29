export interface AiCompletionParams {
  system: string;
  user: string;
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: "json" | "text";
}

/**
 * Common interface that all AI providers must implement.
 * This allows the engine to swap providers transparently.
 */
export interface AiProvider {
  readonly name: string;
  complete(params: AiCompletionParams): Promise<string>;
}

import { aiComplete } from "./engine";

export interface ProposalGenerationInput {
  clientName: string;
  clientIndustry?: string | null;
  services?: { name: string; price: string; billing: string }[];
  existingProjects?: string;
  userId: string;
}

export interface ProposalGenerationOutput {
  title: string;
  value: string;
  niche: string;
  scope: string;
}

export async function generateProposal(
  input: ProposalGenerationInput
): Promise<ProposalGenerationOutput> {
  const servicesContext = input.services?.length
    ? `Servicos atuais contratados:\n${input.services
        .map((s) => `- ${s.name}: R$ ${s.price} (${s.billing})`)
        .join("\n")}`
    : "Nenhum servico contratado atualmente.";

  const userMessage = [
    `Cliente: ${input.clientName}`,
    `Ramo: ${input.clientIndustry || "Nao especificado"}`,
    servicesContext,
    input.existingProjects
      ? `Projetos em andamento: ${input.existingProjects}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await aiComplete({
    userId: input.userId,
    feature: "proposal",
    userMessage,
    clientName: input.clientName,
    clientIndustry: input.clientIndustry || undefined,
    responseFormat: "json",
    maxTokens: 1500,
  });

  const parsed = result.parsed as Record<string, string> | undefined;

  return {
    title:
      parsed?.title || `Proposta Comercial - ${input.clientName}`,
    value: parsed?.value || "R$ 0,00",
    niche:
      parsed?.niche || input.clientIndustry || "Tecnologia",
    scope:
      parsed?.scope || "Proposta em analise...",
  };
}

// Re-export engine and types for convenience
export { aiComplete } from "./engine";
export type { AiCompletionRequest, AiCompletionResponse } from "./engine";
export { buildSystemPrompt } from "./prompts";
export type { PromptContext } from "./prompts";
export { providers, defaultModels } from "./providers";
export { getAiSettings, upsertAiSettings } from "./settings";

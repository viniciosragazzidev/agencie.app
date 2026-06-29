export interface PromptContext {
  botName?: string | null;
  systemPrompt?: string | null;
  persona?: string | null;
  guidelines?: string | null;
  feature?: "proposal" | "scope" | "chat" | "briefing" | "contract";
  clientName?: string;
  clientIndustry?: string;
  additionalContext?: string;
}

/**
 * Feature-specific instruction snippets appended to the system prompt.
 * These define WHAT the AI should do for each feature.
 */
const FEATURE_INSTRUCTIONS: Record<string, string> = {
  proposal: [
    "Gere uma proposta comercial personalizada para upsell/expansao.",
    "Retorne APENAS um JSON valido com: { \"title\", \"value\", \"niche\", \"scope\" }.",
    "Precos devem ser realistas para o mercado brasileiro.",
    "Nao inclua texto fora do JSON.",
  ].join("\n"),

  scope: [
    "Gere o escopo detalhado de um servico de marketing digital.",
    'Retorne APENAS um JSON valido com: { "description", "deliverables": string[], "phases": string[], "estimatedHours": number }.',
    "Cada fase deve ter um titulo e descricao clara.",
  ].join("\n"),

  chat: [
    "Responda a mensagem do cliente de forma profissional e prestativa.",
    "Se nao souber a resposta baseada nos documentos, diga que um especialista entrara em contato.",
    "Nao invente informacoes que nao estejam no contexto fornecido.",
    "Mantenha respostas concisas (maximo 3 paragrafos).",
  ].join("\n"),

  briefing: [
    "Analise as informacoes do briefing e gere sugestoes estrategicas.",
    "Considere o publico-alvo, orcamento, prazo e objetivos de negocio.",
    "Sugira canais, formatos e KPIs relevantes.",
  ].join("\n"),

  contract: [
    "Gere clausulas contratuais apropriadas para o tipo de servico.",
    "Inclua: objeto, valor, prazo, rescisao, confidencialidade e foro.",
    "Use linguagem juridica acessivel mas formal.",
  ].join("\n"),
};

/**
 * Build the full system prompt by layering:
 * 1. Base identity (always present)
 * 2. Bot name
 * 3. Persona / tone of voice
 * 4. Guidelines / rules
 * 5. Feature-specific instructions
 * 6. Client context
 * 7. Additional context (RAG, notes, etc.)
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // Layer 1: Base identity
  parts.push(
    ctx.systemPrompt ||
      "Voce e um assistente inteligente de uma agencia de marketing digital e tecnologia."
  );

  // Layer 2: Bot name
  if (ctx.botName && ctx.botName !== "Agencie AI") {
    parts.push(`Seu nome e ${ctx.botName}. Apresente-se quando apropriado.`);
  }

  // Layer 3: Persona / tone
  if (ctx.persona) {
    parts.push(`Tom de voz e personalidade:\n${ctx.persona}`);
  }

  // Layer 4: Guidelines / rules
  if (ctx.guidelines) {
    parts.push(`Diretrizes e regras obrigatorias:\n${ctx.guidelines}`);
  }

  // Layer 5: Feature-specific instructions
  if (ctx.feature && FEATURE_INSTRUCTIONS[ctx.feature]) {
    parts.push(FEATURE_INSTRUCTIONS[ctx.feature]);
  }

  // Layer 6: Client context
  if (ctx.clientName) {
    const clientLine = `Cliente atual: ${ctx.clientName}`;
    const industryLine = ctx.clientIndustry ? ` (${ctx.clientIndustry})` : "";
    parts.push(clientLine + industryLine);
  }

  // Layer 7: Additional context (RAG results, notes, etc.)
  if (ctx.additionalContext) {
    parts.push(`Contexto adicional relevante:\n${ctx.additionalContext}`);
  }

  return parts.join("\n\n");
}

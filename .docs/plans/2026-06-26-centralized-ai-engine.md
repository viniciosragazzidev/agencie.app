# Centralized AI Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a centralized AI engine module that all features (proposals, RAG chat, scope generation, etc.) consume, with multi-provider support, fallback chains, persistent settings, and a configurable system prompt layer.

**Architecture:** A single `lib/ai/engine.ts` module acts as the AI gateway. It reads provider config and system prompts from a new `aiSettings` DB table (via `lib/ai/settings.ts`). Each AI call flows through: System Prompt Builder → Provider Router (with fallback) → Response Parser. The existing `lib/ai.ts` becomes a thin consumer of this engine.

**Tech Stack:** TypeScript, Drizzle ORM, Groq SDK (existing), OpenAI SDK (new), `@ai-sdk/anthropic` (new), `@ai-sdk/google` (new — optional, can add later). Env vars for API keys. Zod for config validation.

---

## Current State Analysis

| What | Where | Issue |
|------|-------|-------|
| AI logic | `lib/ai.ts` | Hardcoded to Groq, inline prompt, single feature only |
| Settings UI | `app/(app)/settings/ai/page.tsx` | Beautiful frontend but NO backend persistence — all state is `useState` mock |
| DB schema | `lib/db/schema.ts` | No `aiSettings` table |
| API route | `app/api/ai/generate-proposal/route.ts` | Only consumer, directly imports `lib/ai.ts` |
| Env | `.env.local` | Only `GROQ_API_KEY` |

---

## Task 1: Database Schema — `aiSettings` Table

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/0012_add_ai_settings.sql`

**What to add:** A new `aiSettings` table (one row per user) that stores:

```ts
export const aiSettings = pgTable("ai_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),

  // Provider configuration
  primaryProvider: text("primary_provider", {
    enum: ["groq", "openai", "anthropic", "google"]
  }).default("groq").notNull(),
  fallbackProvider: text("fallback_provider", {
    enum: ["groq", "openai", "anthropic", "google"]
  }).default("openai"),
  modelPrimary: text("model_primary").default("llama-3.3-70b-versatile"),
  modelFallback: text("model_fallback").default("gpt-4o-mini"),
  temperature: real("temperature").default(0.7).notNull(),
  maxTokens: integer("max_tokens").default(2048).notNull(),

  // System prompt / persona (the "central brain instructions")
  botName: text("bot_name").default("Agencie AI"),
  systemPrompt: text("system_prompt").notNull().default(
    "Você é um assistente inteligente de uma agência de marketing digital e tecnologia."
  ),
  persona: text("persona"),        // Tom de voz
  guidelines: text("guidelines"),  // Regras e limites

  // Feature flags
  autoPilot: boolean("auto_pilot").default(true),
  humanHandoff: boolean("human_handoff").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});
```

Also add the relation in `userRelations`.

**After editing schema, run:** `npm run db:generate` then `npm run db:push`

---

## Task 2: AI Settings Data Access Layer

**Files:**
- Create: `lib/ai/settings.ts`

**Purpose:** CRUD for `aiSettings` — `getAiSettings(userId)`, `upsertAiSettings(userId, data)`. Ensures a default row exists on first access.

```ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiSettings } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type AiSettingsData = typeof aiSettings.$inferInsert;

export async function getAiSettings(userId: string) {
  const existing = await db
    .select()
    .from(aiSettings)
    .where(eq(aiSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Auto-create default row
  const [created] = await db
    .insert(aiSettings)
    .values({ id: randomUUID(), userId })
    .returning();
  return created;
}

export async function upsertAiSettings(userId: string, data: Partial<AiSettingsData>) {
  const existing = await getAiSettings(userId);
  const [updated] = await db
    .update(aiSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(aiSettings.id, existing.id))
    .returning();
  return updated;
}
```

---

## Task 3: System Prompt Builder

**Files:**
- Create: `lib/ai/prompts.ts`

**Purpose:** Assembles the full system prompt by combining:
1. **Base identity** (always present)
2. **Persona / tone of voice**
3. **Guidelines / rules**
4. **Feature-specific instructions** (proposal, scope, chat, etc.)

```ts
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

const FEATURE_PROMPTS: Record<string, string> = {
  proposal: `Gere uma proposta comercial personalizada para upsell/expansão.
Retorne APENAS um JSON válido com: { "title", "value", "niche", "scope" }.
Preços devem ser realistas para o mercado brasileiro.`,
  
  scope: `Gere o escopo detalhado de um serviço de marketing digital.
Retorne APENAS um JSON válido com: { "description", "deliverables": string[], "phases": string[], "estimatedHours": number }.`,

  chat: `Responda à mensagem do cliente de forma profissional e prestativa.
Se não souber a resposta, diga que um especialista entrará em contato.`,
  
  briefing: `Analise as informações do briefing e gere sugestões estratégicas.`,
  
  contract: `Gere cláusulas contratuais apropriadas para o tipo de serviço.`,
};

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // Layer 1: Base identity
  parts.push(ctx.systemPrompt || "Você é um assistente inteligente de uma agência de marketing digital e tecnologia.");

  // Layer 2: Persona
  if (ctx.persona) {
    parts.push(`Tom de voz: ${ctx.persona}`);
  }

  // Layer 3: Guidelines
  if (ctx.guidelines) {
    parts.push(`Diretrizes e regras:\n${ctx.guidelines}`);
  }

  // Layer 4: Feature-specific
  if (ctx.feature && FEATURE_PROMPTS[ctx.feature]) {
    parts.push(FEATURE_PROMPTS[ctx.feature]);
  }

  // Layer 5: Client context
  if (ctx.clientName) {
    parts.push(`Cliente atual: ${ctx.clientName}${ctx.clientIndustry ? ` (${ctx.clientIndustry})` : ""}`);
  }

  // Layer 6: Additional context (RAG, notes, etc.)
  if (ctx.additionalContext) {
    parts.push(`Contexto adicional:\n${ctx.additionalContext}`);
  }

  return parts.join("\n\n");
}
```

---

## Task 4: Provider Abstraction Layer

**Files:**
- Create: `lib/ai/providers/groq.ts`
- Create: `lib/ai/providers/openai.ts`
- Create: `lib/ai/providers/base.ts`

**Purpose:** Each provider implements a common interface. The engine routes to the primary provider, falling back to the secondary on failure.

**`lib/ai/providers/base.ts`:**
```ts
export interface AiProvider {
  name: string;
  complete(params: {
    system: string;
    user: string;
    model: string;
    temperature: number;
    maxTokens: number;
    responseFormat?: "json" | "text";
  }): Promise<string>;
}
```

**`lib/ai/providers/groq.ts`:**
```ts
import Groq from "groq-sdk";
import type { AiProvider } from "./base";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const groqProvider: AiProvider = {
  name: "groq",
  async complete({ system, user, model, temperature, maxTokens, responseFormat }) {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
    });
    return completion.choices?.[0]?.message?.content || "";
  },
};
```

**`lib/ai/providers/openai.ts`:**
```ts
import OpenAI from "openai";
import type { AiProvider } from "./base";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiProvider: AiProvider = {
  name: "openai",
  async complete({ system, user, model, temperature, maxTokens, responseFormat }) {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
    });
    return completion.choices?.[0]?.message?.content || "";
  },
};
```

---

## Task 5: The Central AI Engine

**Files:**
- Create: `lib/ai/engine.ts`

**Purpose:** The single entry point all features call. Reads settings, builds prompt, routes to provider with fallback.

```ts
import { getAiSettings, type AiSettingsData } from "./settings";
import { buildSystemPrompt, type PromptContext } from "./prompts";
import { groqProvider } from "./providers/groq";
import { openaiProvider } from "./providers/openai";
import type { AiProvider } from "./providers/base";

const PROVIDERS: Record<string, AiProvider> = {
  groq: groqProvider,
  openai: openaiProvider,
};

const MODEL_DEFAULTS: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
};

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

export async function aiComplete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
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

  const primaryProvider = PROVIDERS[settings.primaryProvider] || groqProvider;
  const fallbackProvider = settings.fallbackProvider
    ? PROVIDERS[settings.fallbackProvider]
    : undefined;

  const modelPrimary = settings.modelPrimary || MODEL_DEFAULTS[settings.primaryProvider] || "llama-3.3-70b-versatile";
  const modelFallback = settings.modelFallback || (fallbackProvider ? MODEL_DEFAULTS[settings.fallbackProvider!] : undefined);

  // Try primary provider
  try {
    const content = await primaryProvider.complete({
      system: systemPrompt,
      user: request.userMessage,
      model: modelPrimary,
      temperature: request.temperature ?? settings.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? settings.maxTokens ?? 2048,
      responseFormat: request.responseFormat,
    });

    return {
      content,
      provider: settings.primaryProvider,
      model: modelPrimary,
      parsed: tryParseJson(content, request.responseFormat),
    };
  } catch (primaryError) {
    console.error(`[AI Engine] Primary provider (${settings.primaryProvider}) failed:`, primaryError);

    // Fallback
    if (fallbackProvider && modelFallback) {
      try {
        const content = await fallbackProvider.complete({
          system: systemPrompt,
          user: request.userMessage,
          model: modelFallback,
          temperature: request.temperature ?? settings.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? settings.maxTokens ?? 2048,
          responseFormat: request.responseFormat,
        });

        return {
          content,
          provider: settings.fallbackProvider!,
          model: modelFallback,
          parsed: tryParseJson(content, request.responseFormat),
        };
      } catch (fallbackError) {
        console.error(`[AI Engine] Fallback provider (${settings.fallbackProvider}) also failed:`, fallbackError);
      }
    }

    throw new Error("Todos os provedores de IA falharam. Verifique suas chaves de API.");
  }
}

function tryParseJson(content: string, format?: string): unknown | undefined {
  if (format !== "json") return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}
```

---

## Task 6: API Routes for AI Settings

**Files:**
- Create: `app/api/ai/settings/route.ts`

**Purpose:** GET/PUT endpoints so the settings page can persist and read AI configuration.

```ts
// GET /api/ai/settings — returns current user's AI settings
// PUT /api/ai/settings — updates AI settings
```

Auth required. Uses `getAiSettings` / `upsertAiSettings` from Task 2.

---

## Task 7: Refactor Existing `lib/ai.ts`

**Files:**
- Modify: `lib/ai.ts`

**Purpose:** Replace the direct Groq call with `aiComplete()` from the engine. This makes `generateProposal` a thin wrapper.

```ts
import { aiComplete } from "./engine";

export interface ProposalGenerationInput {
  clientName: string;
  clientIndustry?: string | null;
  services?: { name: string; price: string; billing: string }[];
  existingProjects?: string;
  userId: string; // NEW — needed to load settings
}

export interface ProposalGenerationOutput {
  title: string;
  value: string;
  niche: string;
  scope: string;
}

export async function generateProposal(input: ProposalGenerationInput): Promise<ProposalGenerationOutput> {
  const servicesContext = input.services?.length
    ? `Serviços atuais:\n${input.services.map(s => `- ${s.name}: R$ ${s.price} (${s.billing})`).join("\n")}`
    : "Nenhum serviço contratado.";

  const userMessage = `Cliente: ${input.clientName}
Ramo: ${input.clientIndustry || "Não especificado"}
${servicesContext}
${input.existingProjects ? `Projetos: ${input.existingProjects}` : ""}`;

  const result = await aiComplete({
    userId: input.userId,
    feature: "proposal",
    userMessage,
    clientName: input.clientName,
    clientIndustry: input.clientIndustry || undefined,
    responseFormat: "json",
  });

  const parsed = result.parsed as Record<string, string> | undefined;
  return {
    title: parsed?.title || `Proposta Comercial - ${input.clientName}`,
    value: parsed?.value || "R$ 0,00",
    niche: parsed?.niche || input.clientIndustry || "Tecnologia",
    scope: parsed?.scope || "Proposta em análise...",
  };
}
```

Also update `app/api/ai/generate-proposal/route.ts` to pass `userId` to `generateProposal`.

---

## Task 8: Connect Settings Page to Backend

**Files:**
- Modify: `app/(app)/settings/ai/page.tsx`

**Purpose:** Replace all `useState` mock state with real API calls. On mount, fetch `GET /api/ai/settings`. On save, `PUT /api/ai/settings`.

Key changes:
- Remove local state defaults → fetch from API on mount
- `handleSaveConfig()` → `PUT /api/ai/settings` with all form fields
- Model selection, temperature, persona, guidelines all persist
- Add env var management section (show which keys are configured)

---

## Task 9: Add `ai` npm Package for OpenAI Provider

**Files:**
- Modify: `package.json`

Run: `npm install openai`

The Groq SDK is already installed. Only OpenAI is needed as an additional provider for the initial implementation. Anthropic and Google can be added later.

---

## Task 10: Add `.env.local` Variables

**Files:**
- Modify: `.env.local` (user must add manually)

```
# AI Providers (at least one required)
GROQ_API_KEY=gsk_...          # Already exists
OPENAI_API_KEY=sk-...         # New — for fallback
```

---

## Task 11: Feature-Specific AI Routes (Future)

After the core engine is working, these routes become trivial to add:

- `app/api/ai/generate-scope/route.ts` — uses `aiComplete({ feature: "scope" })`
- `app/api/ai/generate-briefing/route.ts` — uses `aiComplete({ feature: "briefing" })`
- `app/api/ai/chat/route.ts` — uses `aiComplete({ feature: "chat" })`

Each is ~20 lines since the engine handles everything.

---

## Task Summary

| # | Task | Complexity | Files |
|---|------|-----------|-------|
| 1 | DB Schema (aiSettings table) | Medium | `schema.ts`, migration |
| 2 | Data Access Layer | Simple | `lib/ai/settings.ts` |
| 3 | System Prompt Builder | Medium | `lib/ai/prompts.ts` |
| 4 | Provider Abstraction | Medium | `lib/ai/providers/*.ts` |
| 5 | Central AI Engine | Medium | `lib/ai/engine.ts` |
| 6 | API Routes for Settings | Simple | `app/api/ai/settings/route.ts` |
| 7 | Refactor `lib/ai.ts` | Simple | `lib/ai.ts`, `route.ts` |
| 8 | Connect Settings UI | Medium | `settings/ai/page.tsx` |
| 9 | Install `openai` package | Simple | `package.json` |
| 10 | Env vars | Simple | `.env.local` |
| 11 | Future feature routes | Simple | Various |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FEATURE LAYER                         │
│  (proposal, scope, chat, briefing, contract, etc.)      │
└──────────────────────┬──────────────────────────────────┘
                       │ aiComplete({ userId, feature, userMessage })
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  lib/ai/engine.ts                        │
│                                                         │
│  1. Load settings from DB (getAiSettings)               │
│  2. Build system prompt (buildSystemPrompt)             │
│  3. Route to primary provider                           │
│  4. On failure → fallback provider                      │
│  5. Parse JSON if needed                                │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           ▼                      ▼
   ┌──────────────┐     ┌──────────────┐
   │ groqProvider │     │ openaiProvider│
   │  (primary)   │     │  (fallback)  │
   └──────────────┘     └──────────────┘

┌─────────────────────────────────────────────────────────┐
│              lib/ai/prompts.ts                          │
│                                                         │
│  Layer 1: Base identity (systemPrompt)                  │
│  Layer 2: Persona / tone of voice                       │
│  Layer 3: Guidelines / rules                            │
│  Layer 4: Feature-specific instructions                 │
│  Layer 5: Client context                                │
│  Layer 6: Additional context (RAG, etc.)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              DB: ai_settings table                       │
│  (per-user: provider, model, prompt, temperature, etc.) │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables Required

```env
# Primary provider (Groq — fast, free tier generous)
GROQ_API_KEY=gsk_...

# Fallback provider (OpenAI — reliable, paid)
OPENAI_API_KEY=sk-...

# Optional future providers
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_GENERATIVE_AI_API_KEY=...
```

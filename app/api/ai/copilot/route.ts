import { NextResponse } from "next/server"
import { aiComplete } from "@/lib/ai/engine"
import { db } from "@/lib/db"
import {
  client,
  clientInteraction,
  clientNote,
  approval,
  clientContract,
  clientScope,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"

const requestSchema = z.object({
  clientId: z.string(),
  context: z.enum(["whatsapp", "email", "general"]),
  tone: z
    .enum(["formal", "casual", "friendly"])
    .optional()
    .default("friendly"),
  additionalContext: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { clientId, context, tone, additionalContext } = parsed.data

    const clientData = await db.query.client.findFirst({
      where: eq(client.id, clientId),
    })
    if (!clientData) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const [recentInteractions, recentNotes, pendingApprovals, activeContracts, activeScopes] =
      await Promise.all([
        db.query.clientInteraction.findMany({
          where: eq(clientInteraction.clientId, clientId),
          orderBy: (i, { desc }) => [desc(i.createdAt)],
          limit: 5,
        }),
        db.query.clientNote.findMany({
          where: eq(clientNote.clientId, clientId),
          orderBy: (n, { desc }) => [desc(n.createdAt)],
          limit: 5,
        }),
        db.query.approval.findMany({
          where: eq(approval.clientId, clientId),
          orderBy: (a, { desc }) => [desc(a.createdAt)],
          limit: 5,
        }),
        db.query.clientContract.findMany({
          where: eq(clientContract.clientId, clientId),
          orderBy: (c, { desc }) => [desc(c.createdAt)],
          limit: 3,
        }),
        db.query.clientScope.findMany({
          where: eq(clientScope.clientId, clientId),
          limit: 5,
        }),
      ])

    const contextLabel =
      context === "whatsapp"
        ? "WhatsApp"
        : context === "email"
          ? "email"
          : "mensagem"
    const toneLabel =
      tone === "formal"
        ? "profissional e formal"
        : tone === "casual"
          ? "descontraido e direto"
          : "amigavel e acolhedor"

    const contextPrompt = `Voce e um assistente de pos-venda inteligente para uma agencia de marketing digital.

Gere 3 opcoes de resposta CURTAS e DISTINTAS para o cliente via ${contextLabel}.

Tom: ${toneLabel}

Regras:
- Cada resposta deve ter no maximo 2-3 frases
- Cada sugestao deve ser DISTINTA e usar palavras diferentes
- NAO repita a mesma ideia com palavras diferentes
- Seja especifico baseado no contexto do cliente
- Inclua uma chamada para acao quando apropriado
- Formato: retorne APENAS um JSON valido com { "suggestions": [{ "text": "...", "scenario": "..." }] }
- "scenario" descreve em 3-5 palavras quando usar aquela resposta
- NAO inclua texto fora do JSON

${additionalContext ? `CONTEXTO ADICIONAL DO USUARIO: ${additionalContext}` : ""}
`

    const result = await aiComplete({
      userId: session.user.id,
      feature: "chat",
      userMessage: contextPrompt,
      clientName: clientData.name,
      clientIndustry: clientData.industry || undefined,
      additionalContext,
      temperature: 0.7,
      maxTokens: 1024,
      responseFormat: "json",
    })

    interface Suggestion {
      text: string
      scenario: string
    }

    let suggestions: Suggestion[]
    try {
      let jsonStr = result.content.trim()
      
      // Strip markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }
      
      const parsed = JSON.parse(jsonStr)
      suggestions = parsed.suggestions || [
        { text: result.content, scenario: "Resposta geral" },
      ]
    } catch {
      // If JSON fails, try to extract suggestions from text
      const lines = result.content.split('\n').filter(l => l.trim())
      suggestions = lines.length > 0 
        ? [{ text: lines.join('\n'), scenario: "Resposta sugerida" }]
        : [{ text: result.content, scenario: "Resposta sugerida" }]
    }

    const seen = new Set<string>()
    suggestions = suggestions.filter((s) => {
      const key = s.text.trim().toLowerCase().replace(/\s+/g, ' ')
      if (seen.has(key)) return false
      seen.add(key)
      return s.text.trim().length > 0
    })

    return NextResponse.json({ suggestions })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate suggestions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

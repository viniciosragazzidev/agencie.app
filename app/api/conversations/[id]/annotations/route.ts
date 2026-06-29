import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation, message, messageAnnotation } from "@/lib/db/schema"
import { eq, and, desc, asc } from "drizzle-orm"
import { aiComplete } from "@/lib/ai/engine"
import crypto from "crypto"

/** GET /api/conversations/[id]/annotations — buscar anotações da conversa */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const annotations = await db
    .select({
      id: messageAnnotation.id,
      messageId: messageAnnotation.messageId,
      summary: messageAnnotation.summary,
      explanation: messageAnnotation.explanation,
      tag: messageAnnotation.tag,
      createdAt: messageAnnotation.createdAt,
      messageContent: message.content,
      messageSentAt: message.sentAt,
      messageDirection: message.direction,
    })
    .from(messageAnnotation)
    .innerJoin(message, eq(messageAnnotation.messageId, message.id))
    .where(eq(messageAnnotation.conversationId, id))
    .orderBy(desc(messageAnnotation.createdAt))

  return NextResponse.json({ annotations })
}

/** POST /api/conversations/[id]/annotations — gerar anotação via IA */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { messageId, messageContent } = await req.json()

  if (!messageId || !messageContent) {
    return NextResponse.json({ error: "messageId and messageContent are required" }, { status: 400 })
  }

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const prompt = `Analise a mensagem abaixo e gere uma anotação para referência futura.

Mensagem: "${messageContent}"

Retorne APENAS um JSON válido com:
{
  "summary": "Resumo curto em 1 linha sobre o que a mensagem trata",
  "explanation": "Explicação detalhada de 2-3 frases sobre o contexto, intenção e importância da mensagem",
  "tag": "important" | "action_required" | "decision" | "info"
}

Classifique como:
- "important": informação relevante que deve ser lembrada
- "action_required": algo que precisa de ação/respuesta
- "decision": uma decisão tomada pelo cliente
- "info": informação geral/contexto`

  try {
    const result = await aiComplete({
      userId: session.user.id,
      feature: "chat",
      userMessage: prompt,
      temperature: 0.3,
      maxTokens: 512,
      responseFormat: "json",
    })

    let jsonStr = result.content.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    const validTags = ["important", "action_required", "decision", "info"]
    const tag = validTags.includes(parsed.tag) ? parsed.tag : "important"

    const [annotation] = await db
      .insert(messageAnnotation)
      .values({
        id: crypto.randomUUID(),
        messageId,
        conversationId: id,
        userId: session.user.id,
        summary: parsed.summary || "Sem resumo",
        explanation: parsed.explanation || "Sem explicação",
        tag,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ annotation })
  } catch (error: any) {
    console.error("[Annotation] AI error:", error?.message || error)
    return NextResponse.json({ error: "Erro ao gerar anotação com IA" }, { status: 500 })
  }
}

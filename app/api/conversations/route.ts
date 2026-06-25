import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation, channelIntegration } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getContactProfilePicture } from "@/lib/integrations/openwa"

/** GET /api/conversations — lista conversas do usuário ordenadas pela mais recente */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversations = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.userId, session.user.id), eq(conversation.isIgnored, false)))
    .orderBy(desc(conversation.lastMessageAt))

  return NextResponse.json({ conversations })
}

/** POST /api/conversations — cria uma conversa sob demanda (ex: "Abordar via Chat") */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { contactPhone, contactName, channel } = await req.json()

  if (!contactPhone && !contactName) {
    return NextResponse.json({ error: "contactPhone or contactName required" }, { status: 400 })
  }

  const ch = channel || "whatsapp"

  // Buscar integração ativa do canal
  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(
      and(
        eq(channelIntegration.userId, session.user.id),
        eq(channelIntegration.channel, ch),
        eq(channelIntegration.status, "active")
      )
    )

  if (!integration) {
    return NextResponse.json({ error: "No active integration for this channel" }, { status: 404 })
  }

  // Montar externalChatId a partir do telefone (normalizar para formato internacional)
  const phoneDigits = (contactPhone || "").replace(/\D/g, "")
  let normalizedPhone = phoneDigits
  // Números brasileiros: garantir DDI 55
  if (normalizedPhone.startsWith("55")) {
    // Já tem DDI — garantir 13 dígitos (55 + 2 ddd + 9 cel + 8 tel)
    if (normalizedPhone.length < 13) {
      // Completar com 9 no celular se faltar
      const ddi = normalizedPhone.slice(0, 2)
      const rest = normalizedPhone.slice(2)
      normalizedPhone = `${ddi}9${rest}`
    }
  } else if (normalizedPhone.length >= 8 && normalizedPhone.length <= 11) {
    // Sem DDI: adicionar 55
    normalizedPhone = `55${normalizedPhone}`
  }
  const externalChatId = normalizedPhone ? `${normalizedPhone}@c.us` : ""

  // Verificar se já existe conversa com esse externalChatId
  if (externalChatId) {
    const [existing] = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.integrationId, integration.id),
          eq(conversation.externalChatId, externalChatId)
        )
      )
    if (existing) {
      return NextResponse.json({ conversation: existing })
    }
  }

  let contactAvatar: string | null = null
  if (ch === "whatsapp" && externalChatId) {
    try {
      contactAvatar = await getContactProfilePicture(integration.externalId, externalChatId)
    } catch {}
  }

  const [newConv] = await db
    .insert(conversation)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      integrationId: integration.id,
      channel: ch,
      externalChatId: externalChatId || `pending-${Date.now()}`,
      contactIdentifier: externalChatId || "",
      contactName: contactName || contactPhone || "Contato",
      contactAvatar: contactAvatar || "",
      lastMessageAt: new Date(),
      lastMessagePreview: "",
      unreadCount: "0",
    })
    .returning()

  return NextResponse.json({ conversation: newConv })
}

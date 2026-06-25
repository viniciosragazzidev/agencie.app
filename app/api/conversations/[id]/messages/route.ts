import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation, message, channelIntegration } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { sendWppTextMessage, sendWppMediaMessage, resolveContactPhone } from "@/lib/integrations/openwa"
import { emitToUser } from "@/app/api/inbox-stream/route"
import crypto from "crypto"

/** GET /api/conversations/[id]/messages — busca histórico de mensagens */
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

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, id))
    .orderBy(asc(message.sentAt))

  return NextResponse.json({ messages, conversation: conv })
}

/** PATCH /api/conversations/[id]/messages — reseta unreadCount */
export async function PATCH(
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

  await db
    .update(conversation)
    .set({ unreadCount: "0", updatedAt: new Date() })
    .where(eq(conversation.id, id))

  return NextResponse.json({ ok: true })
}

/** POST /api/conversations/[id]/messages — envia mensagem via canal correto */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { text, mediaUrl, mediaType, fileName } = await req.json()

  if (!text?.trim() && !mediaUrl) {
    return NextResponse.json({ error: "Text or media is required" }, { status: 400 })
  }

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(eq(channelIntegration.id, conv.integrationId))

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 })
  }

  let externalMessageId: string | undefined

  if (integration.channel === "whatsapp") {
    try {
      const wppSession = await import("@/lib/integrations/openwa").then((m) =>
        m.getWppSession(integration.externalId)
      ).catch(() => null)

      if (!wppSession) {
        return NextResponse.json({ error: "Falha ao conectar com OpenWA" }, { status: 503 })
      }

      if (wppSession.status !== "ready") {
        return NextResponse.json({ error: `WhatsApp está com status: ${wppSession.status}` }, { status: 503 })
      }

      let chatId = conv.externalChatId

      if (chatId.includes("@lid") || !chatId.includes("@")) {
        const resolved = await resolveContactPhone(integration.externalId, chatId)
        if (resolved) {
          chatId = resolved.includes("@") ? resolved : `${resolved}@c.us`
        }
      }

      const phonePart = chatId.replace("@c.us", "").replace(/@.*/, "")
      if (/^\d+$/.test(phonePart) && !chatId.includes("@lid")) {
        let p = phonePart
        if (!p.startsWith("55") && p.length >= 8 && p.length <= 11) {
          p = `55${p}`
        } else if (p.startsWith("55") && p.length < 13) {
          p = `55${p.slice(2)}`
        }
        if (p !== phonePart) {
          chatId = `${p}@c.us`
        }
      }

      if (!chatId || !chatId.includes("@")) {
        return NextResponse.json({ error: `ChatId inválido: ${chatId}` }, { status: 400 })
      }

      if (mediaUrl) {
        let base64: string | undefined
        let mimetype: string | undefined
        if (mediaUrl.startsWith("data:")) {
          const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            mimetype = match[1]
            base64 = match[2]
          }
        }
        const typeParam = (mediaType === "image" || mediaType === "audio" || mediaType === "video" || mediaType === "document") ? mediaType : "document"
        const result = await sendWppMediaMessage(
          integration.externalId,
          chatId,
          typeParam,
          {
            base64,
            url: !base64 ? mediaUrl : undefined,
            mimetype,
            caption: text || undefined,
            filename: fileName || undefined,
          }
        )
        externalMessageId = result.messageId
        console.log("[SEND] Mídia enviada:", result.messageId)
      } else {
        const result = await sendWppTextMessage(
          integration.externalId,
          chatId,
          text
        )
        externalMessageId = result.messageId
        console.log("[SEND] Mensagem enviada:", result.messageId)
      }
    } catch (err: any) {
      console.error("[SEND] Falha ao enviar:", err?.message || err)
      return NextResponse.json({ error: "Falha ao enviar mensagem via WhatsApp" }, { status: 502 })
    }
  }

  const finalContent = text?.trim() || (mediaType === "image" ? "📷 Imagem" : mediaType === "audio" ? "🎤 Áudio" : mediaType === "video" ? "🎥 Vídeo" : "📄 Anexo")

  const [newMessage] = await db
    .insert(message)
    .values({
      id: crypto.randomUUID(),
      conversationId: id,
      userId: session.user.id,
      direction: "outbound",
      externalMessageId,
      content: finalContent,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      status: "sent",
      sentAt: new Date(),
    })
    .returning()

  await db
    .update(conversation)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: finalContent.substring(0, 100),
      updatedAt: new Date(),
    })
    .where(eq(conversation.id, id))

  emitToUser(session.user.id, {
    type: "message_sent",
    conversationId: id,
    message: newMessage,
  })

  return NextResponse.json({ message: newMessage })
}

import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { channelIntegration, conversation, message } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { emitToUser } from "@/app/api/inbox-stream/route"
import { getContactProfilePicture } from "@/lib/integrations/openwa"

function extractContent(data: any): string {
  if (data.body) return data.body
  if (data.metadata?.caption) return data.metadata.caption
  if (data.metadata?.text) return data.metadata.text
  return ""
}

function getMessagePreviewText(body: string, type: string): string {
  if (body && body.trim()) return body.trim()
  if (type === "image") return "📷 Imagem"
  if (type === "audio" || type === "voice" || type === "ptt") return "🎤 Áudio"
  if (type === "video") return "🎥 Vídeo"
  if (type === "document") return "📄 Documento"
  if (type === "sticker") return "💟 Figurinha"
  if (type === "location") return "📍 Localização"
  if (type === "contact") return "👤 Contato"
  return "Mídia"
}

/**
 * POST /api/webhooks/whatsapp
 * Recebe eventos do OpenWA (message.received, session.status).
 */
export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-openwa-signature") || req.headers.get("x-hub-signature-256")

  const secret = process.env.OPENWA_WEBHOOK_SECRET || ""
  if (secret) {
    const expected = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")}`

    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (payload.event === "session.status") {
    const { sessionId, status } = payload.data || {}
    if (sessionId) {
      const [integration] = await db
        .select()
        .from(channelIntegration)
        .where(eq(channelIntegration.externalId, sessionId))

      if (integration) {
        const newStatus = status === "ready" ? "active" : status === "failed" ? "error" : "disconnected"
        await db
          .update(channelIntegration)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(channelIntegration.id, integration.id))

        emitToUser(integration.userId, {
          type: "integration_status",
          integrationId: integration.id,
          status: newStatus,
        })
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (payload.event === "message.status") {
    const { sessionId, messageId: msgId, status: msgStatus } = payload.data || {}
    if (!sessionId || !msgId) {
      return NextResponse.json({ ok: true })
    }

    const [integration] = await db
      .select()
      .from(channelIntegration)
      .where(eq(channelIntegration.externalId, sessionId))

    if (!integration) {
      return NextResponse.json({ ok: true })
    }

    const statusMap: Record<string, string> = {
      sent: "sent",
      delivered: "delivered",
      read: "read",
      played: "read",
    }
    const newStatus = statusMap[msgStatus] || msgStatus

    const [existingMsg] = await db
      .select()
      .from(message)
      .where(and(
        eq(message.externalMessageId, msgId),
        eq(message.userId, integration.userId)
      ))

    if (existingMsg) {
      await db
        .update(message)
        .set({ status: newStatus })
        .where(eq(message.id, existingMsg.id))

      emitToUser(integration.userId, {
        type: "message_status_update",
        conversationId: existingMsg.conversationId,
        messageId: existingMsg.id,
        status: newStatus,
      })
    }

    return NextResponse.json({ ok: true })
  }

  if (payload.event !== "message.received") {
    return NextResponse.json({ ok: true })
  }

  const { sessionId, from, messageId, timestamp: msgTs, ...msgData } = payload.data || {}
  const msgBody = extractContent(msgData)
  const msgType = msgData.type || "text"

  let mediaUrl: string | null = null
  let mediaType: string | null = null
  if (msgData.media && msgData.media.data) {
    const mime = msgData.media.mimetype || "application/octet-stream"
    mediaUrl = `data:${mime};base64,${msgData.media.data}`
    mediaType = msgType !== "text" ? msgType : "file"
  } else if (msgType !== "text" && msgType !== "unknown") {
    mediaType = msgType
  }

  const previewText = getMessagePreviewText(msgBody, msgType)
  const finalContent = msgBody && msgBody.trim() ? msgBody : previewText

  if (!sessionId || !from) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(eq(channelIntegration.externalId, sessionId))

  if (!integration) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 })
  }

  const userId = integration.userId
  const externalChatId = from

  let [conv] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.integrationId, integration.id),
        eq(conversation.externalChatId, externalChatId)
      )
    )

  if (!conv) {
    let contactAvatar: string | null = null
    try {
      contactAvatar = await getContactProfilePicture(sessionId, externalChatId)
    } catch {}

    const [newConv] = await db
      .insert(conversation)
      .values({
        id: crypto.randomUUID(),
        userId,
        integrationId: integration.id,
        channel: "whatsapp",
        externalChatId,
        contactIdentifier: externalChatId,
        contactName: payload.data?.notifyName || externalChatId,
        contactAvatar: contactAvatar || "",
        lastMessageAt: new Date(),
        lastMessagePreview: previewText.substring(0, 100),
        unreadCount: "1",
      })
      .returning()
    conv = newConv
  } else {
    if (!conv.isIgnored) {
      await db
        .update(conversation)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: previewText.substring(0, 100),
          unreadCount: String(parseInt(conv.unreadCount || "0") + 1),
          updatedAt: new Date(),
        })
        .where(eq(conversation.id, conv.id))
    }
  }

  if (messageId) {
    const [existing] = await db
      .select()
      .from(message)
      .where(and(
        eq(message.externalMessageId, messageId),
        eq(message.conversationId, conv.id)
      ))
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
  }

  const [newMessage] = await db
    .insert(message)
    .values({
      id: crypto.randomUUID(),
      conversationId: conv.id,
      userId,
      direction: "inbound",
      externalMessageId: messageId,
      content: finalContent,
      mediaUrl,
      mediaType,
      status: "delivered",
      sentAt: msgTs ? new Date(msgTs * 1000) : new Date(),
    })
    .returning()

  if (!conv.isIgnored) {
    emitToUser(userId, {
      type: "new_message",
      conversationId: conv.id,
      message: newMessage,
      conversation: {
        ...conv,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: previewText.substring(0, 100),
      },
    })
  }

  return NextResponse.json({ ok: true })
}

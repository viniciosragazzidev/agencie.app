import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration, conversation, message } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getWppMessages, getContactProfilePicture } from "@/lib/integrations/openwa"
import { emitToUser } from "@/app/api/inbox-stream/route"

function extractContent(omsg: any): string {
  if (omsg.body) return omsg.body
  if (omsg.metadata?.caption) return omsg.metadata.caption
  if (omsg.metadata?.text) return omsg.metadata.text
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
  if (type === "list_response") return "📋 Opção selecionada"
  if (type === "buttons_response") return "🔘 Resposta interativa"
  return "Mídia"
}

/**
 * POST /api/integrations/whatsapp/sync
 * Busca mensagens recentes do OpenWA e sincroniza com o banco.
 * Usado como fallback quando o webhook não funciona (ex: localhost).
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Buscar integração WPP ativa
  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(
      and(
        eq(channelIntegration.userId, session.user.id),
        eq(channelIntegration.channel, "whatsapp")
      )
    )

  if (!integration || integration.status !== "active") {
    return NextResponse.json({ ok: true, synced: 0, reason: "no active integration" })
  }

  try {
    // Buscar últimas 30 mensagens do OpenWA
    const { messages: openwaMessages } = await getWppMessages(integration.externalId, { limit: 30 })

    // Migrar conversas com externalChatId sem @ (formato antigo)
    const allConvs = await db
      .select()
      .from(conversation)
      .where(eq(conversation.integrationId, integration.id))

    for (const c of allConvs) {
      if (c.externalChatId && !c.externalChatId.includes("@")) {
        const newJid = `${c.externalChatId}@c.us`
        await db
          .update(conversation)
          .set({ externalChatId: newJid, contactIdentifier: newJid })
          .where(eq(conversation.id, c.id))
      }
      if (!c.contactAvatar && c.externalChatId) {
        try {
          const avatarUrl = await getContactProfilePicture(integration.externalId, c.externalChatId)
          if (avatarUrl) {
            await db
              .update(conversation)
              .set({ contactAvatar: avatarUrl })
              .where(eq(conversation.id, c.id))
            c.contactAvatar = avatarUrl
          }
        } catch {}
      }
    }

    let synced = 0

    for (const omsg of openwaMessages) {
      // Só processar mensagens incoming (recebidas de outros)
      if (omsg.direction !== "incoming") continue

      // Guardar o JID completo (phone@c.us, phone@s.whatsapp.net, lid@lid, etc.)
      const externalChatId = omsg.from
      const msgBody = extractContent(omsg)
      const msgType = omsg.type || "text"

      let mediaUrl: string | null = null
      let mediaType: string | null = null
      const mediaObj = (omsg.metadata as any)?.media
      if (mediaObj && mediaObj.data) {
        const mime = mediaObj.mimetype || "application/octet-stream"
        mediaUrl = `data:${mime};base64,${mediaObj.data}`
        mediaType = msgType !== "text" ? msgType : "file"
      } else if (msgType !== "text" && msgType !== "unknown") {
        mediaType = msgType
      }

      const previewText = getMessagePreviewText(msgBody, msgType)
      const finalContent = msgBody && msgBody.trim() ? msgBody : previewText

      // Buscar ou criar conversa
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
          contactAvatar = await getContactProfilePicture(integration.externalId, externalChatId)
        } catch {}

        const contactName = (omsg.metadata?.notifyName as string) || externalChatId
        try {
          const [newConv] = await db
            .insert(conversation)
            .values({
              id: crypto.randomUUID(),
              userId: session.user.id,
              integrationId: integration.id,
              channel: "whatsapp",
              externalChatId,
              contactIdentifier: externalChatId,
              contactName,
              contactAvatar,
              lastMessageAt: new Date(omsg.timestamp * 1000),
              lastMessagePreview: previewText.substring(0, 100),
              unreadCount: "1",
            })
            .returning()
          conv = newConv
        } catch (insertErr: any) {
          // Unique constraint violation (23505) = race condition
          if (insertErr?.code === "23505") {
            const [existing] = await db
              .select()
              .from(conversation)
              .where(
                and(
                  eq(conversation.integrationId, integration.id),
                  eq(conversation.externalChatId, externalChatId)
                )
              )
            conv = existing || null
          } else {
            console.error("[Sync] Unexpected DB error creating conversation:", insertErr)
            continue
          }
        }
      } else {
        if (!conv.isIgnored) {
          await db
            .update(conversation)
            .set({
              lastMessageAt: new Date(omsg.timestamp * 1000),
              lastMessagePreview: previewText.substring(0, 100),
              unreadCount: String(parseInt(conv.unreadCount || "0") + 1),
              updatedAt: new Date(),
            })
            .where(eq(conversation.id, conv.id))
        }
      }

      // Deduplicação por conversationId
      const externalId = omsg.waMessageId || omsg.id
      if (externalId) {
        const [existing] = await db
          .select()
          .from(message)
          .where(and(
            eq(message.externalMessageId, externalId),
            eq(message.conversationId, conv.id)
          ))
        if (existing) continue
        // Also check globally to catch duplicates across conversations
        const [globalExisting] = await db
          .select({ id: message.id })
          .from(message)
          .where(and(
            eq(message.externalMessageId, externalId),
            eq(message.userId, session.user.id)
          ))
          .limit(1)
        if (globalExisting) continue
      }

      // Inserir mensagem
      const [newMessage] = await db
        .insert(message)
        .values({
          id: crypto.randomUUID(),
          conversationId: conv.id,
          userId: session.user.id,
          direction: "inbound",
          externalMessageId: externalId,
          content: finalContent,
          mediaUrl,
          mediaType,
          status: "delivered",
          sentAt: new Date(omsg.timestamp * 1000),
        })
        .returning()

      // Emitir SSE
      if (!conv.isIgnored) {
        emitToUser(session.user.id, {
          type: "new_message",
          conversationId: conv.id,
          message: newMessage,
          conversation: {
            ...conv,
            lastMessageAt: new Date(omsg.timestamp * 1000).toISOString(),
            lastMessagePreview: previewText.substring(0, 100),
          },
        })
      }

      synced++
    }

    return NextResponse.json({ ok: true, synced })
  } catch (err) {
    console.error("[WhatsApp Sync] Erro:", err)
    return NextResponse.json({ error: "Falha ao sincronizar mensagens" }, { status: 500 })
  }
}

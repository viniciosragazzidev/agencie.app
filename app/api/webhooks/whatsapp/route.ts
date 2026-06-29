import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { channelIntegration, conversation, message, clientMeeting, clientPoll, approval, clientSatisfaction, clientNote, lead } from "@/lib/db/schema"
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
  if (type === "list_response") return "📋 Opção selecionada"
  if (type === "buttons_response") return "🔘 Resposta interativa"
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

  // --- RESOLVER CONVERSA (antes do processamento de interações) ---
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

    const newId = crypto.randomUUID()
    try {
      const [newConv] = await db
        .insert(conversation)
        .values({
          id: newId,
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
    } catch (insertErr: any) {
      // Unique constraint violation (23505) = race condition: another request inserted the same conversation
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
        console.error("[Webhook] Unexpected DB error creating conversation:", insertErr)
        return NextResponse.json({ error: "DB error" }, { status: 500 })
      }
    }
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

  // --- PROCESSAMENTO DE RESPOSTAS INTERATIVAS (list_response / buttons_response) ---
  const isInteractiveResponse = msgType === "list_response" || msgType === "buttons_response"
  if (isInteractiveResponse) {
    try {
      const interactiveBody = (msgBody || finalContent || "").trim()
      const quotedMsgId = msgData.quotedMsgId || msgData.quotedMsg?.id || null

      if (interactiveBody && conv) {
        // Find the last outgoing message in this conversation (the interactive message the client is responding to)
        const lookupId = quotedMsgId
        if (lookupId) {
          const [pollRecord] = await db
            .select()
            .from(clientPoll)
            .where(eq(clientPoll.externalMessageId, lookupId))
            .limit(1)

          if (pollRecord) {
            const { referenceId, type: pollType, clientId } = pollRecord

            if (pollType === "material_approval" && referenceId) {
              const isApprove = interactiveBody.toLowerCase().includes("aprovado") || interactiveBody.toLowerCase().includes("approved")
              const isRevision = interactiveBody.toLowerCase().includes("alterações") || interactiveBody.toLowerCase().includes("revision") || interactiveBody.toLowerCase().includes("alteracao")

              if (isApprove || isRevision) {
                const newStatus = isApprove ? "approved" : "revision"
                await db
                  .update(approval)
                  .set({ status: newStatus, approvedAt: isApprove ? new Date() : null, updatedAt: new Date() })
                  .where(eq(approval.id, referenceId))
                emitToUser(userId, { type: "approval_update", approvalId: referenceId, status: newStatus })
              }
            } else if (pollType === "nps") {
              let score = 10
              const digitMatch = interactiveBody.match(/\d+/)
              if (digitMatch) score = parseInt(digitMatch[0], 10)
              else if (interactiveBody.toLowerCase().includes("bom")) score = 8
              else if (interactiveBody.toLowerCase().includes("melhorar")) score = 4

              if (clientId) {
                await db.insert(clientSatisfaction).values({
                  id: crypto.randomUUID(),
                  clientId, score,
                  note: `Resposta interativa WhatsApp: ${interactiveBody}`,
                })
                emitToUser(userId, { type: "nps_update", clientId, score })
              }
            } else if (pollType === "lead_qualification" && referenceId) {
              let value = 0
              if (interactiveBody.includes("3k") && interactiveBody.includes("6k")) value = 6000
              else if (interactiveBody.includes("3k")) value = 3000
              else if (interactiveBody.includes("6k")) value = 10000

              await db
                .update(lead)
                .set({ status: "qualified", value: value || undefined, updatedAt: new Date() })
                .where(eq(lead.id, referenceId))
              emitToUser(userId, { type: "lead_update", leadId: referenceId, status: "qualified", value })
            } else if (pollType === "payment_method" && clientId) {
              await db.insert(clientNote).values({
                id: crypto.randomUUID(), clientId, userId,
                content: `[Preferência de Pagamento] Selecionada via WhatsApp: ${interactiveBody}`,
                tag: "general",
              })
              emitToUser(userId, { type: "payment_method_update", clientId, method: interactiveBody })
            } else if (pollType === "meeting_confirmation" && referenceId) {
              const isConfirm = interactiveBody.toLowerCase().includes("confirmar") || interactiveBody.toLowerCase().includes("sim")
              const isDecline = interactiveBody.toLowerCase().includes("alterar") || interactiveBody.toLowerCase().includes("não")

              if (isConfirm || isDecline) {
                const newStatus = isConfirm ? "confirmed" : "declined"
                await db
                  .update(clientMeeting)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(clientMeeting.id, referenceId))
                emitToUser(userId, { type: "meeting_update", meetingId: referenceId, status: newStatus })
              }
            }
          }
        }
      }
    } catch (interactiveErr) {
      console.error("[Webhook Interactive Response] Failed:", interactiveErr)
    }
  }

  // --- PROCESSAMENTO DE ENQUETES / POLLS ---
  const quotedId = msgData.quotedMsgId || msgData.quotedMsg?.id || msgData.pollCreationMessageId
  const isPollEvent = (msgType === "poll_creation_answer" || msgType === "poll_update" || !!quotedId) && !isInteractiveResponse

  if (isPollEvent && quotedId) {
    try {
      const [pollRecord] = await db
        .select()
        .from(clientPoll)
        .where(eq(clientPoll.externalMessageId, quotedId))
        .limit(1)

      if (pollRecord) {
        const voteOption = (msgBody || finalContent || "").trim()
        if (voteOption) {
          const { referenceId, type: pollType, clientId } = pollRecord

          if (pollType === "meeting_confirmation" && referenceId) {
            const isConfirm = voteOption.toLowerCase().includes("confirmar") || voteOption.toLowerCase().includes("👍") || voteOption.toLowerCase().includes("sim")
            const isDecline = voteOption.toLowerCase().includes("alterar") || voteOption.toLowerCase().includes("📅") || voteOption.toLowerCase().includes("não") || voteOption.toLowerCase().includes("nao")

            if (isConfirm || isDecline) {
              const newStatus = isConfirm ? "confirmed" : "declined"
              await db
                .update(clientMeeting)
                .set({ status: newStatus, updatedAt: new Date() })
                .where(eq(clientMeeting.id, referenceId))

              emitToUser(userId, {
                type: "meeting_update",
                meetingId: referenceId,
                status: newStatus,
              })
            }
          } else if (pollType === "material_approval" && referenceId) {
            const isApprove = voteOption.toLowerCase().includes("aprovado") || voteOption.toLowerCase().includes("✅") || voteOption.toLowerCase().includes("sim")
            const isRevision = voteOption.toLowerCase().includes("alterações") || voteOption.toLowerCase().includes("revisões") || voteOption.toLowerCase().includes("✏️")

            if (isApprove || isRevision) {
              const newStatus = isApprove ? "approved" : "revision"
              await db
                .update(approval)
                .set({
                  status: newStatus,
                  approvedAt: isApprove ? new Date() : null,
                  updatedAt: new Date(),
                })
                .where(eq(approval.id, referenceId))

              emitToUser(userId, {
                type: "approval_update",
                approvalId: referenceId,
                status: newStatus,
              })
            }
          } else if (pollType === "nps") {
            let score = 10
            const digitMatch = voteOption.match(/\d+/)
            if (digitMatch) {
              score = parseInt(digitMatch[0], 10)
            } else if (voteOption.toLowerCase().includes("bom")) {
              score = 8
            } else if (voteOption.toLowerCase().includes("melhorar")) {
              score = 4
            }

            if (clientId) {
              await db.insert(clientSatisfaction).values({
                id: crypto.randomUUID(),
                clientId,
                score,
                note: `Voto via enquete WhatsApp: ${voteOption}`,
              })

              emitToUser(userId, {
                type: "nps_update",
                clientId,
                score,
              })
            }
          } else if (pollType === "lead_qualification" && referenceId) {
            let value = 0
            if (voteOption.includes("3k") && voteOption.includes("6k")) {
              value = 6000
            } else if (voteOption.includes("3k")) {
              value = 3000
            } else if (voteOption.includes("6k")) {
              value = 10000
            }

            await db
              .update(lead)
              .set({
                status: "qualified",
                value: value || undefined,
                updatedAt: new Date(),
              })
              .where(eq(lead.id, referenceId))

            emitToUser(userId, {
              type: "lead_update",
              leadId: referenceId,
              status: "qualified",
              value,
            })
          } else if (pollType === "payment_method") {
            if (clientId) {
              await db.insert(clientNote).values({
                id: crypto.randomUUID(),
                clientId,
                userId,
                content: `[Preferência de Faturamento] Selecionada via WhatsApp: ${voteOption}`,
                tag: "general",
              })

              emitToUser(userId, {
                type: "payment_method_update",
                clientId,
                method: voteOption,
              })
            }
          }
        }
      }
    } catch (pollErr) {
      console.error("[Webhook Poll Processing] Failed:", pollErr)
    }
  }

  // --- Dedup by externalMessageId (per conversation) ---
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
    // Also check globally in case a duplicate conversation existed
    const [globalExisting] = await db
      .select({ id: message.id })
      .from(message)
      .where(and(
        eq(message.externalMessageId, messageId),
        eq(message.userId, userId)
      ))
      .limit(1)
    if (globalExisting) {
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

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval, client, channelIntegration, conversation, message } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const approvals = await db.select().from(approval).where(eq(approval.clientId, clientId))
  return NextResponse.json(approvals)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, userId, title, description, fileUrl, fileType } = body

    const [item] = await db.insert(approval).values({
      id: crypto.randomUUID(),
      clientId,
      userId,
      title,
      description,
      fileUrl,
      fileType,
    }).returning()

    // Automatização do envio de notificação via WhatsApp (Inbox Integration)
    try {
      const [clientRecord] = await db
        .select()
        .from(client)
        .where(eq(client.id, clientId))

      if (clientRecord && clientRecord.contactPhone && userId) {
        // Buscar integração ativa do WhatsApp para este usuário
        const [integration] = await db
          .select()
          .from(channelIntegration)
          .where(
            and(
              eq(channelIntegration.userId, userId),
              eq(channelIntegration.channel, "whatsapp"),
              eq(channelIntegration.status, "active")
            )
          )

        if (integration) {
          // Normalizar o telefone do contato
          const phoneDigits = clientRecord.contactPhone.replace(/\D/g, "")
          let normalizedPhone = phoneDigits
          if (normalizedPhone.startsWith("55")) {
            if (normalizedPhone.length < 13) {
              const ddi = normalizedPhone.slice(0, 2)
              const rest = normalizedPhone.slice(2)
              normalizedPhone = `${ddi}9${rest}`
            }
          } else if (normalizedPhone.length >= 8 && normalizedPhone.length <= 11) {
            normalizedPhone = `55${normalizedPhone}`
          }

          const externalChatId = normalizedPhone ? `${normalizedPhone}@c.us` : ""

          if (externalChatId) {
            // Obter ou criar a conversa (chat) no banco de dados
            let [conv] = await db
              .select()
              .from(conversation)
              .where(
                and(
                  eq(conversation.integrationId, integration.id),
                  eq(conversation.externalChatId, externalChatId)
                )
              )

            const messageText = `📢 *Nova Solicitação de Aprovação*\n\n*Título:* ${title}\n${
              description ? `*Descrição:* ${description}\n` : ""
            }${fileUrl ? `*Visualizar arquivo:* ${fileUrl}\n` : ""}\nPor favor, responda com "Aprovado" ou detalhe as alterações necessárias.`

            if (!conv) {
              const [newConv] = await db
                .insert(conversation)
                .values({
                  id: crypto.randomUUID(),
                  userId,
                  integrationId: integration.id,
                  channel: "whatsapp",
                  externalChatId,
                  contactName: clientRecord.contactName || clientRecord.name,
                  contactIdentifier: externalChatId,
                  lastMessageAt: new Date(),
                  lastMessagePreview: messageText.substring(0, 100),
                })
                .returning()
              conv = newConv
            }

            // Enviar mensagem de texto via OpenWA
            const { sendWppTextMessage } = await import("@/lib/integrations/openwa")
            await sendWppTextMessage(integration.externalId, externalChatId, messageText)

            // Salvar a mensagem como "outbound" na tabela message
            await db.insert(message).values({
              id: crypto.randomUUID(),
              conversationId: conv.id,
              userId,
              direction: "outbound",
              content: messageText,
              status: "sent",
              sentAt: new Date(),
            })

            // Atualizar o preview e data da conversa
            await db
              .update(conversation)
              .set({
                lastMessageAt: new Date(),
                lastMessagePreview: messageText.substring(0, 100),
                updatedAt: new Date(),
              })
              .where(eq(conversation.id, conv.id))
          }
        }
      }
    } catch (notifyErr: any) {
      // Capturar falhas de envio de notificação para não travar a criação da aprovação principal
      console.error("[APPROVAL-NOTIFICATION] Falha ao notificar cliente via WhatsApp:", notifyErr?.message || notifyErr)
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create approval" }, { status: 500 })
  }
}

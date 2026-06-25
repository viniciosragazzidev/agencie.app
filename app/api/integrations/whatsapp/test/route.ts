import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration, conversation, message } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { sendWppTextMessage, getWppSession } from "@/lib/integrations/openwa"
import { emitToUser } from "@/app/api/inbox-stream/route"

/**
 * POST /api/integrations/whatsapp/test
 * Envia uma mensagem de teste para o próprio número conectado.
 * Útil para verificar se o pipeline completo está funcionando:
 *   API → OpenWA → WhatsApp → Webhook → SSE → UI
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Buscar integração WPP ativa do usuário
  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(
      and(
        eq(channelIntegration.userId, session.user.id),
        eq(channelIntegration.channel, "whatsapp")
      )
    )

  if (!integration) {
    return NextResponse.json({ error: "Nenhuma integração WhatsApp encontrada" }, { status: 404 })
  }

  if (integration.status !== "active") {
    return NextResponse.json({ error: "WhatsApp não está conectado" }, { status: 400 })
  }

  // Obter número de telefone da sessão conectada
  let phoneNumber: string | undefined
  try {
    const wppSession = await getWppSession(integration.externalId)
    phoneNumber = wppSession.phoneNumber
  } catch (err) {
    return NextResponse.json({ error: "Falha ao obter dados da sessão WhatsApp" }, { status: 502 })
  }

  if (!phoneNumber) {
    return NextResponse.json({ error: "Número de telefone não disponível na sessão" }, { status: 400 })
  }

  // Limpar número: remover +, espaços, traços
  const cleanPhone = phoneNumber.replace(/[\s\-+]/g, "")

  const testMessage = `✅ Teste de conexão Agencie.app\n${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`

  // Enviar mensagem de teste para si mesmo
  let externalMessageId: string | undefined
  try {
    const result = await sendWppTextMessage(integration.externalId, cleanPhone, testMessage)
    externalMessageId = result.messageId
  } catch (err) {
    console.error("[WhatsApp Test] Falha ao enviar:", err)
    return NextResponse.json({ error: "Falha ao enviar mensagem via WhatsApp" }, { status: 502 })
  }

  // Buscar ou criar conversa com si mesmo
  let [conv] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.integrationId, integration.id),
        eq(conversation.externalChatId, cleanPhone)
      )
    )

  if (!conv) {
    const [newConv] = await db
      .insert(conversation)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        integrationId: integration.id,
        channel: "whatsapp",
        externalChatId: cleanPhone,
        contactIdentifier: cleanPhone,
        contactName: "Teste (eu)",
        lastMessageAt: new Date(),
        lastMessagePreview: testMessage.substring(0, 100),
        unreadCount: "0",
      })
      .returning()
    conv = newConv
  } else {
    await db
      .update(conversation)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: testMessage.substring(0, 100),
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, conv.id))
  }

  // Persistir mensagem
  const [newMessage] = await db
    .insert(message)
    .values({
      id: crypto.randomUUID(),
      conversationId: conv.id,
      userId: session.user.id,
      direction: "outbound",
      externalMessageId,
      content: testMessage,
      status: "sent",
      sentAt: new Date(),
    })
    .returning()

  // Emitir SSE
  emitToUser(session.user.id, {
    type: "new_message",
    conversationId: conv.id,
    message: newMessage,
    conversation: {
      ...conv,
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: testMessage.substring(0, 100),
    },
  })

  return NextResponse.json({
    ok: true,
    message: "Mensagem de teste enviada! Ela deve chegar no seu WhatsApp e aparecer no inbox.",
    conversationId: conv.id,
  })
}

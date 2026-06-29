import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, lead, conversation, clientInteraction, channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      leadId,
      conversationId,
      name,
      industry,
      status,
      projects,
      mrr,
      contactName,
      contactEmail,
      contactPhone,
      document,
      notes,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 })
    }

    const clientId = crypto.randomUUID()

    // Exemplo de transação no drizzle-orm
    const result = await db.transaction(async (tx) => {
      // 1. Criar o cliente
      const [newClient] = await tx
        .insert(client)
        .values({
          id: clientId,
          userId: session.user.id,
          name,
          industry: industry || null,
          status: status || "Ativo",
          projects: projects || "1",
          mrr: mrr || "0",
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          document: document || null,
          notes: notes || null,
          portalEnabled: true, // Habilitar o portal por padrão
        })
        .returning()

      // 2. Se tinha leadId, atualizar para status "won"
      if (leadId) {
        await tx
          .update(lead)
          .set({ status: "won", updatedAt: new Date() })
          .where(and(eq(lead.id, leadId), eq(lead.userId, session.user.id)))
      }

      // 3. Atualizar a conversa atual se existir
      if (conversationId) {
        await tx
          .update(conversation)
          .set({
            contactName: contactName || name,
            updatedAt: new Date(),
          })
          .where(and(eq(conversation.id, conversationId), eq(conversation.userId, session.user.id)))
      }

      // 4. Criar uma interação de registro automático
      await tx.insert(clientInteraction).values({
        id: crypto.randomUUID(),
        clientId,
        userId: session.user.id,
        type: "note",
        description: `Lead convertido em cliente durante chat. Empresa: ${name}.`,
        isAutomatic: true,
      })

      return newClient
    })

    // 5. Enviar mensagem de boas-vindas via WhatsApp (se conversa existe)
    if (conversationId && result.contactPhone) {
      try {
        const [integration] = await db
          .select()
          .from(channelIntegration)
          .where(
            and(
              eq(channelIntegration.userId, session.user.id),
              eq(channelIntegration.channel, "whatsapp"),
              eq(channelIntegration.status, "active")
            )
          )
          .limit(1)

        if (integration) {
          const phone = result.contactPhone.replace(/\D/g, "")
          const chatId = phone.startsWith("55")
            ? `${phone}@c.us`
            : `55${phone}@c.us`

          const welcomeMessage =
            `Ola ${result.name || result.contactName || "equipe"}! \n\n` +
            `Foi um prazer fecharmos parceria. Estamos muito felizes em trabalhar juntos!\n\n` +
            `Voce recebera aqui atualizacoes dos seus projetos e podera acompanhar tudo pelo nosso portal.\n\n` +
            `Se tiver qualquer duvida, e so responder esta mensagem.`

          await fetch(
            `${process.env.OPENWA_API_URL}/message/sendText/${integration.externalId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId, text: welcomeMessage }),
            }
          )

          await db.insert(clientInteraction).values({
            id: crypto.randomUUID(),
            clientId,
            userId: session.user.id,
            type: "message",
            description: "Mensagem automatica de boas-vindas enviada via WhatsApp.",
            isAutomatic: true,
          })
        }
      } catch (err) {
        console.error("Erro ao enviar boas-vindas:", err)
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to convert lead" }, { status: 500 })
  }
}

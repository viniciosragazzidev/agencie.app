import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { project, client, clientAsset, clientScope, channelIntegration, clientInteraction } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params

    const result = await db.transaction(async (tx) => {
      const [proj] = await tx
        .select()
        .from(project)
        .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
        .limit(1)

      if (!proj) throw new Error("Projeto nao encontrado")

      const assets = await tx
        .select()
        .from(clientAsset)
        .where(eq(clientAsset.clientId, proj.clientId))

      const scopes = await tx
        .select()
        .from(clientScope)
        .where(and(
          eq(clientScope.clientId, proj.clientId),
          eq(clientScope.status, "active")
        ))

      const lines: string[] = []
      lines.push(`*Handover do Projeto: ${proj.name}*`)
      lines.push(``)
      lines.push(`Status: Concluido`)
      lines.push(`Data: ${new Date().toLocaleDateString("pt-BR")}`)
      lines.push(``)
      if (assets.length > 0) {
        lines.push(`*Entregaveis:*`)
        for (const a of assets) {
          lines.push(`- ${a.name} (${a.category}) - ${a.fileUrl || a.linkUrl || "sem link"}`)
        }
        lines.push(``)
      }
      if (scopes.length > 0) {
        lines.push(`*Escopo Contratado:*`)
        for (const s of scopes) {
          lines.push(`- ${s.label}: ${s.usedQuota}/${s.totalQuota} (${s.period})`)
        }
      }
      const handoverSummary = lines.join("\n")

      const [integration] = await tx
        .select()
        .from(channelIntegration)
        .where(and(
          eq(channelIntegration.userId, session.user.id),
          eq(channelIntegration.channel, "whatsapp"),
          eq(channelIntegration.status, "active")
        ))
        .limit(1)

      const [clientData] = await tx
        .select({ contactPhone: client.contactPhone, name: client.name })
        .from(client)
        .where(eq(client.id, proj.clientId))
        .limit(1)

      if (integration && clientData?.contactPhone) {
        const phone = clientData.contactPhone.replace(/\D/g, "")
        const chatId = phone.startsWith("55") ? `${phone}@c.us` : `55${phone}@c.us`

        await fetch(
          `${process.env.OPENWA_API_URL}/message/sendText/${integration.externalId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, text: handoverSummary }),
          }
        )
      }

      await tx
        .update(project)
        .set({ status: "done", updatedAt: new Date() })
        .where(eq(project.id, projectId))

      await tx.insert(clientInteraction).values({
        id: crypto.randomUUID(),
        clientId: proj.clientId,
        userId: session.user.id,
        type: "delivery",
        description: `Projeto "${proj.name}" concluido. Handover automatico enviado.`,
        isAutomatic: true,
      })

      return { success: true, handoverSummary }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

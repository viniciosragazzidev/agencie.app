import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { deleteWppSession, removeWppWebhook } from "@/lib/integrations/openwa"

/** GET /api/integrations/[id] — busca integração específica do usuário */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(and(eq(channelIntegration.id, id), eq(channelIntegration.userId, session.user.id)))

  if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ integration })
}

/** PATCH /api/integrations/[id] — atualiza campos da integração */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const [updated] = await db
    .update(channelIntegration)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(channelIntegration.id, id), eq(channelIntegration.userId, session.user.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ integration: updated })
}

/** DELETE /api/integrations/[id] — desconecta e remove integração */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(and(eq(channelIntegration.id, id), eq(channelIntegration.userId, session.user.id)))

  if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Encerrar sessão no OpenWA se for WhatsApp
  if (integration.channel === "whatsapp" && integration.externalId) {
    try {
      await removeWppWebhook(integration.externalId)
      await deleteWppSession(integration.externalId)
    } catch (_) {
      // Ignorar erro — sessão pode já ter expirado
    }
  }

  await db
    .delete(channelIntegration)
    .where(eq(channelIntegration.id, id))

  return NextResponse.json({ success: true })
}

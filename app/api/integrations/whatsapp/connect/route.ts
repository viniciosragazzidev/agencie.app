import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createWppSession, registerWppWebhook, getWppSession, deleteWppSession, removeWppWebhook } from "@/lib/integrations/openwa"

/**
 * POST /api/integrations/whatsapp/connect
 * Inicia uma nova sessão WPP no OpenWA, registra webhook e salva no banco.
 * Retorna qrCode base64 para o cliente escanear.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verificar se já existe integração WPP para este usuário
  const existing = await db
    .select()
    .from(channelIntegration)
    .where(
      and(
        eq(channelIntegration.userId, session.user.id),
        eq(channelIntegration.channel, "whatsapp")
      )
    )

  if (existing.length > 0) {
    const existingInt = existing[0]
    console.log("[Connect] Existing integration found:", { id: existingInt.id, status: existingInt.status, externalId: existingInt.externalId })

    // Validar se a sessão ainda existe no OpenWA
    try {
      const wppSession = await getWppSession(existingInt.externalId)
      console.log("[Connect] Existing session validated:", wppSession.status)

      // Se já está conectada, retornar direto
      if (wppSession.status === "ready") {
        await db
          .update(channelIntegration)
          .set({ status: "active", qrCode: null, accountName: wppSession.name ?? null, updatedAt: new Date() })
          .where(eq(channelIntegration.id, existingInt.id))
        return NextResponse.json({ integration: { ...existingInt, status: "active", accountName: wppSession.name }, qrCode: null })
      }

      // Se tem QR code, retornar
      if (wppSession.qrCode) {
        return NextResponse.json({ integration: existingInt, qrCode: wppSession.qrCode })
      }

      // Sessão existe mas sem QR — retornar e deixar o status-stream pollar
      return NextResponse.json({ integration: existingInt, qrCode: existingInt.qrCode })
    } catch (err) {
      // Sessão não existe mais no OpenWA (stale/broken) — limpar e criar nova
      console.log("[Connect] Existing session invalid in OpenWA, cleaning up:", err)
      try {
        await removeWppWebhook(existingInt.externalId)
      } catch (_) {}
      try {
        await deleteWppSession(existingInt.externalId)
      } catch (_) {}
      await db.delete(channelIntegration).where(eq(channelIntegration.id, existingInt.id))
    }
  }

  // Gerar sessionId único e derivado do userId (garante isolamento) - Alfanumérico e hifens apenas!
  const sessionId = `agencie-${session.user.id.slice(0, 8).toLowerCase()}-${Date.now().toString(36)}`

  let openwaRes
  try {
    console.log("[Connect] Creating OpenWA session:", sessionId)
    openwaRes = await createWppSession(sessionId)
    console.log("[Connect] OpenWA session created:", { uuid: openwaRes.sessionId, status: openwaRes.status, hasQr: !!openwaRes.qrCode })
  } catch (err) {
    console.error("[Connect] Failed to create OpenWA session:", err)
    return NextResponse.json(
      { error: "OpenWA indisponível. Verifique se o container está rodando (porta 2785)." },
      { status: 503 }
    )
  }

  // Registrar webhook para receber mensagens em tempo real
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`
  try {
    await registerWppWebhook(sessionId, webhookUrl, process.env.OPENWA_WEBHOOK_SECRET || "")
  } catch (_) {
    // Webhook pode falhar em dev (localhost não alcançável externamente) — continuar mesmo assim
  }

  // Salvar integração no banco
  const [integration] = await db
    .insert(channelIntegration)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      channel: "whatsapp",
      externalId: openwaRes.sessionId,
      status: openwaRes.status === "ready" ? "active" : "qr_pending",
      qrCode: openwaRes.qrCode ?? null,
      accountName: openwaRes.name ?? null,
    })
    .returning()

  return NextResponse.json({
    integration,
    qrCode: openwaRes.qrCode,
  })
}

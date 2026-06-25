import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getWppSession } from "@/lib/integrations/openwa"

/**
 * GET /api/integrations/[id]/status-stream
 * SSE que faz polling no OpenWA a cada 2s e emite eventos de status ao cliente.
 *
 * Eventos emitidos:
 * - { type: "qr_updated", qrCode: string }
 * - { type: "connected", phoneNumber: string, name: string }
 * - { type: "error", message: string }
 * - { type: "ping" } — heartbeat a cada 10s para manter conexão
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await params

  const [integration] = await db
    .select()
    .from(channelIntegration)
    .where(
      and(
        eq(channelIntegration.id, id),
        eq(channelIntegration.userId, session.user.id)
      )
    )

  if (!integration || integration.channel !== "whatsapp") {
    console.log("[StatusStream] Integration not found or not whatsapp:", id, integration?.channel)
    return new Response("Integration not found", { status: 404 })
  }

  console.log("[StatusStream] Starting SSE for integration:", id, "externalId:", integration.externalId, "status:", integration.status)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let connected = false
      let closed = false
      let pingCount = 0
      let consecutiveErrors = 0

      const send = (data: object) => {
        if (closed || req.signal.aborted) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (_) {}
      }

      const safeClose = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch (_) {}
      }

      // Poll OpenWA a cada 2s por até 5 minutos
      const MAX_POLLS = 150 // 5min
      let polls = 0

      const poll = async () => {
        if (req.signal.aborted) {
          console.log("[StatusStream] Request aborted, closing")
          safeClose()
          return
        }

        if (connected || polls >= MAX_POLLS) {
          console.log("[StatusStream] Stopping poll: connected=", connected, "polls=", polls)
          safeClose()
          return
        }

        polls++
        pingCount++
        console.log("[StatusStream] Poll #", polls, "for integration:", integration.externalId)

        try {
          const wppSession = await getWppSession(integration.externalId)
          console.log("[StatusStream] Poll result - status:", wppSession.status, "hasQr:", !!wppSession.qrCode)

          if (wppSession.status === "ready") {
            connected = true

            // Atualizar banco com status ativo
            await db
              .update(channelIntegration)
              .set({
                status: "active",
                qrCode: null,
                accountName: wppSession.name ?? null,
                updatedAt: new Date(),
              })
              .where(eq(channelIntegration.id, id))

            console.log("[StatusStream] Sending 'connected' event")
            send({
              type: "connected",
              phoneNumber: wppSession.phoneNumber,
              name: wppSession.name,
            })

            safeClose()
            return
          }

          if (wppSession.qrCode) {
            console.log("[StatusStream] Sending 'qr_updated' event")
            send({ type: "qr_updated", qrCode: wppSession.qrCode })

            // Persistir QR no banco para eventual reload
            await db
              .update(channelIntegration)
              .set({ qrCode: wppSession.qrCode, status: "qr_pending", updatedAt: new Date() })
              .where(eq(channelIntegration.id, id))
          } else {
            console.log("[StatusStream] No QR code available, status:", wppSession.status)
          }

          consecutiveErrors = 0 // Resetar contador de erros em caso de sucesso

          // Heartbeat a cada 10s
          if (pingCount % 5 === 0) {
            send({ type: "ping" })
          }
        } catch (err) {
          consecutiveErrors++
          console.error(`[StatusStream] Poll error (${consecutiveErrors}/5):`, err)

          // Só mandar erro ao cliente após 5 falhas consecutivas (10s)
          if (consecutiveErrors >= 5) {
            send({ type: "error", message: "OpenWA indisponível" })
          }
        }

        // Agendar próximo poll
        if (!connected && polls < MAX_POLLS && !req.signal.aborted) {
          setTimeout(poll, 2000)
        } else {
          safeClose()
        }
      }

      // Cancelar ao fechar conexão do cliente
      req.signal.addEventListener("abort", () => {
        connected = true // Parar o loop
        safeClose()
      })

      // Iniciar polling
      setTimeout(poll, 500)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

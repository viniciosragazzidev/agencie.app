/**
 * SSE global de inbox por userId.
 *
 * GET /api/inbox-stream — abre conexão SSE permanente para o usuário autenticado.
 * Quando o webhook do WhatsApp (ou futuramente Meta) recebe uma mensagem,
 * chama emitToUser() para enviá-la instantaneamente ao cliente correto.
 *
 * Isolamento: cada entrada do Map é keyed por userId — sem cross-contamination entre usuários.
 */

import { auth } from "@/lib/auth"

// Singleton em memória: userId → ReadableStreamDefaultController
// Em produção com múltiplos processos, substituir por Redis pub/sub
export const inboxStreams = new Map<string, ReadableStreamDefaultController<Uint8Array>>()

const encoder = new TextEncoder()

/** Emite um evento SSE para um usuário específico */
export function emitToUser(userId: string, event: object): void {
  const controller = inboxStreams.get(userId)
  if (controller) {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    } catch {
      // Controller fechado — remover do map
      inboxStreams.delete(userId)
    }
  }
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = session.user.id

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Registrar controller para este usuário
      inboxStreams.set(userId, controller)

      // Heartbeat a cada 30s para manter a conexão viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))
        } catch {
          clearInterval(heartbeat)
          inboxStreams.delete(userId)
        }
      }, 30_000)

      // Limpar ao desconectar
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        inboxStreams.delete(userId)
      })
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

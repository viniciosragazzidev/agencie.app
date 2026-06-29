import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { aiComplete } from "@/lib/ai/engine"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const result = await aiComplete({
      userId: session.user.id,
      feature: "chat",
      userMessage: message,
      temperature: 0.7,
      maxTokens: 1024,
    })

    return NextResponse.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar mensagem"
    console.error("[AI Test Chat]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

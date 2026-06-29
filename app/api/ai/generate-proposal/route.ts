import { NextResponse } from "next/server"
import { generateProposal } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientName, clientIndustry, services, existingProjects } = body

    if (!clientName) {
      return NextResponse.json({ error: "clientName is required" }, { status: 400 })
    }

    const proposal = await generateProposal({
      userId: session.user.id,
      clientName,
      clientIndustry: clientIndustry || null,
      services: services || [],
      existingProjects: existingProjects || "",
    })

    return NextResponse.json(proposal)
  } catch (err) {
    console.error("[AI Generate Proposal] error:", err)
    const message = err instanceof Error ? err.message : "Erro ao gerar proposta via IA"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

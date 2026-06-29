import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset, service, user } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, serviceIds, customPrices, notes } = body

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }
    if (!serviceIds || serviceIds.length === 0) {
      return NextResponse.json({ error: "serviceIds are required" }, { status: 400 })
    }

    // Buscar os detalhes dos serviços selecionados
    const servicesList = await db
      .select()
      .from(service)
      .where(and(eq(service.userId, session.user.id), inArray(service.id, serviceIds)))

    if (servicesList.length === 0) {
      return NextResponse.json({ error: "No services found" }, { status: 404 })
    }

    const proposalTitle = `Proposta Comercial - ${servicesList.map((s) => s.name).join(", ")}`
    
    // Detalhar a proposta nas notas do asset
    const proposalDetails = servicesList
      .map((s) => `- ${s.name}: R$ ${customPrices?.[s.id] || s.price} (${s.billing})`)
      .join("\n") + (notes ? `\n\nObservações: ${notes}` : "")

    const [agencyUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const agencyUsername = agencyUser?.username || session.user.id
    const portalLink = `/portal/${agencyUsername}/projetos`

    // Criar o asset de proposta do cliente
    const [newAsset] = await db
      .insert(clientAsset)
      .values({
        id: crypto.randomUUID(),
        clientId,
        userId: session.user.id,
        name: proposalTitle,
        category: "contract",
        linkUrl: portalLink,
        notes: proposalDetails,
      })
      .returning()

    return NextResponse.json({
      asset: newAsset,
      services: servicesList,
      portalLink,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create proposal" }, { status: 500 })
  }
}

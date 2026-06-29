export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset, client, user, agencySettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getPortalClient } from "@/lib/portal-auth"
import { generateProposalPdf } from "@/lib/pdf-renderer"

type Params = Promise<{ id: string }>

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    // Authorization
    const session = await auth.api.getSession({ headers: request.headers })
    const portal = !session ? await getPortalClient() : null

    if (!session && !portal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session?.user?.id || portal?.agencyId
    const portalClientId = portal?.clientId || null

    // Fetch the asset (proposal)
    let asset: typeof clientAsset.$inferSelect | null = null

    if (portalClientId) {
      const [row] = await db
        .select()
        .from(clientAsset)
        .where(
          and(
            eq(clientAsset.id, id),
            eq(clientAsset.clientId, portalClientId)
          )
        )
        .limit(1)
      asset = row || null
    } else if (userId) {
      const [row] = await db
        .select({ asset: clientAsset })
        .from(clientAsset)
        .innerJoin(client, eq(clientAsset.clientId, client.id))
        .where(
          and(
            eq(clientAsset.id, id),
            eq(client.userId, userId)
          )
        )
        .limit(1)
      asset = row?.asset || null
    }

    if (!asset) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Fetch client, user, and agency settings info
    const [clientRecord] = await db.select().from(client).where(eq(client.id, asset.clientId)).limit(1)
    const [userRecord] = await db.select().from(user).where(eq(user.id, asset.userId)).limit(1)
    const [settings] = await db.select().from(agencySettings).where(eq(agencySettings.userId, asset.userId)).limit(1)

    // Parse proposal data from the asset notes
    // The create-proposal route stores: "- name: R$ X (billing)" lines in notes
    const notes = asset.notes || ""
    const lines = notes.split("\n").filter(l => l.trim())
    
    const services: { name: string; price: string; billing: string; description?: string | null }[] = []
    let totalValue = 0
    let extraNotes = ""

    for (const line of lines) {
      if (line.startsWith("- ") && !line.startsWith("Observações:")) {
        const match = line.match(/^- (.+?):\s*R\$\s*([\d.,]+)/)
        if (match) {
          const name = match[1].trim()
          const priceStr = match[2].replace(/\./g, "").replace(",", ".")
          const price = parseFloat(priceStr)
          totalValue += price

          const billingMatch = line.match(/\(([^)]+)\)/)
          const billing = billingMatch ? billingMatch[1] : "mensal"

          services.push({ name, price: String(price), billing })
        }
      } else if (line.startsWith("Observações:")) {
        extraNotes = line.replace("Observações:", "").trim()
      }
    }

    const formattedTotal = totalValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

    const agencyName = settings?.agencyName || userRecord?.name || userRecord?.username || "Agência"
    const clientName = clientRecord?.name || "Cliente"

    // Generate PDF using the helper (handles JSX in .tsx file)
    const pdfBuffer = await generateProposalPdf({
      proposalTitle: asset.name,
      agencyName,
      clientName,
      services: services.length > 0
        ? services
        : [{ name: notes || "Serviços contratados", price: "0", billing: "mensal" }],
      totalValue: services.length > 0 ? formattedTotal : "Consulte o contrato",
      notes: extraNotes || undefined,
      portalLink: asset.linkUrl || undefined,
      createdAt: asset.createdAt.toISOString(),
      agencyCnpj: settings?.cnpj || undefined,
      agencyAddress: settings?.address || undefined,
      primaryColor: settings?.primaryColor || undefined,
    })

    const filename = asset.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + ".pdf"

    return new Response(new Blob([pdfBuffer as BlobPart], { type: "application/pdf" }), {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error("[PDF proposal] error:", err)
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500 })
  }
}

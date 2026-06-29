export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientContract, client, agencySettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getPortalClient } from "@/lib/portal-auth"
import { generateContractPdf } from "@/lib/pdf-renderer"

type Params = Promise<{ id: string }>

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    // Authorization: try agency session first, then portal token
    const session = await auth.api.getSession({ headers: request.headers })
    const portal = !session ? await getPortalClient() : null

    if (!session && !portal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session?.user?.id || portal?.agencyId
    const portalClientId = portal?.clientId || null

    // Fetch contract with authorization
    let contract: typeof clientContract.$inferSelect | null = null

    if (portalClientId) {
      const [row] = await db
        .select()
        .from(clientContract)
        .where(
          and(
            eq(clientContract.id, id),
            eq(clientContract.clientId, portalClientId)
          )
        )
        .limit(1)
      contract = row || null
    } else if (userId) {
      const [row] = await db
        .select({ contract: clientContract })
        .from(clientContract)
        .innerJoin(client, eq(clientContract.clientId, client.id))
        .where(
          and(
            eq(clientContract.id, id),
            eq(client.userId, userId)
          )
        )
        .limit(1)
      contract = row?.contract || null
    }

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Fetch agency settings for branding
    const contractUserId = contract.userId
    const [settings] = await db
      .select()
      .from(agencySettings)
      .where(eq(agencySettings.userId, contractUserId))
      .limit(1)

    // Generate PDF using the helper (handles JSX in .tsx file)
    const pdfBuffer = await generateContractPdf({
      title: contract.title,
      content: contract.content,
      status: contract.status,
      signerName: contract.signerName,
      signerDocument: contract.signerDocument,
      signerIp: contract.signerIp,
      signedAt: contract.signedAt ? contract.signedAt.toISOString() : null,
      agencyName: settings?.agencyName || null,
      agencyCnpj: settings?.cnpj || null,
      agencyAddress: settings?.address || null,
      agencyPhone: settings?.phone || null,
      agencyEmail: settings?.email || null,
      primaryColor: settings?.primaryColor || null,
      contractFooter: settings?.contractFooter || null,
    })

    const filename = contract.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + ".pdf"

    return new Response(new Blob([pdfBuffer as BlobPart], { type: "application/pdf" }), {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error("[PDF contract] error:", err)
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500 })
  }
}

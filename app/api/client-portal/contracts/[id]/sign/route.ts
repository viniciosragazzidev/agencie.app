import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientContract } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { signerName, signerDocument } = body

    if (!signerName || !signerDocument) {
      return NextResponse.json({ error: "signerName and signerDocument are required" }, { status: 400 })
    }

    // 1. Fetch contract
    const [contract] = await db
      .select()
      .from(clientContract)
      .where(eq(clientContract.id, id))
      .limit(1)

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // 2. Authorize
    const authorized = await authorizePortalClient(contract.clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 3. Resolve Signer IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"

    // 4. Update contract
    const [updated] = await db
      .update(clientContract)
      .set({
        status: "signed",
        signedAt: new Date(),
        signerName,
        signerDocument,
        signerIp: ip,
        updatedAt: new Date(),
      })
      .where(eq(clientContract.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("[POST contract sign] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

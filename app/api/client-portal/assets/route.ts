import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const assets = await db.select().from(clientAsset).where(eq(clientAsset.clientId, clientId))
  return NextResponse.json(assets)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, name, category, fileUrl, linkUrl, notes } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [asset] = await db.insert(clientAsset).values({
    id: crypto.randomUUID(),
    clientId, userId, name, category, fileUrl, linkUrl, notes,
  }).returning()

  return NextResponse.json(asset)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientScope } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const scopes = await db.select().from(clientScope).where(eq(clientScope.clientId, clientId))
  return NextResponse.json(scopes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, label, totalQuota, period } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [scope] = await db.insert(clientScope).values({
    id: crypto.randomUUID(),
    clientId, userId, label, totalQuota, period,
  }).returning()

  return NextResponse.json(scope)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientSatisfaction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const scores = await db.select().from(clientSatisfaction)
    .where(eq(clientSatisfaction.clientId, clientId))
    .orderBy(desc(clientSatisfaction.createdAt))
  return NextResponse.json(scores)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, score, note } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [item] = await db.insert(clientSatisfaction).values({
    id: crypto.randomUUID(),
    clientId, score, note,
  }).returning()

  return NextResponse.json(item)
}

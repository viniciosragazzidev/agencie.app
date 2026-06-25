import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientQuicklink } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = await db.select().from(clientQuicklink)
    .where(eq(clientQuicklink.clientId, clientId))
    .orderBy(asc(clientQuicklink.position))
  return NextResponse.json(links)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, label, url, icon, position } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [link] = await db.insert(clientQuicklink).values({
    id: crypto.randomUUID(),
    clientId, userId, label, url, icon, position,
  }).returning()

  return NextResponse.json(link)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, clientInteraction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const clientId = searchParams.get("clientId")

  // Portal mode: single client
  if (clientId) {
    const authorized = await authorizePortalClient(clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [c] = await db.select().from(client).where(eq(client.id, clientId)).limit(1)
    if (!c) return NextResponse.json([], { status: 200 })

    const lastInteraction = await db.select().from(clientInteraction)
      .where(eq(clientInteraction.clientId, c.id))
      .orderBy(desc(clientInteraction.createdAt))
      .limit(1)

    const lastDate = lastInteraction[0]?.createdAt || c.updatedAt
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 7) {
      return NextResponse.json([{
        clientId: c.id,
        clientName: c.name,
        daysSinceContact: daysSince,
        severity: daysSince >= 14 ? "critical" : "warning",
      }])
    }
    return NextResponse.json([])
  }

  // Agency mode: all clients
  if (!userId) return NextResponse.json({ error: "userId or clientId required" }, { status: 400 })

  const clients = await db.select().from(client).where(eq(client.userId, userId))
  const alerts = []

  for (const c of clients) {
    const lastInteraction = await db.select().from(clientInteraction)
      .where(eq(clientInteraction.clientId, c.id))
      .orderBy(desc(clientInteraction.createdAt))
      .limit(1)

    const lastDate = lastInteraction[0]?.createdAt || c.updatedAt
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 7) {
      alerts.push({
        clientId: c.id,
        clientName: c.name,
        daysSinceContact: daysSince,
        severity: daysSince >= 14 ? "critical" : "warning",
      })
    }
  }

  return NextResponse.json(alerts)
}

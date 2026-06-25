import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, clientInteraction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

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

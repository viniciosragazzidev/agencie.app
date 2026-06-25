import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adSpendTracker } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trackers = await db.select().from(adSpendTracker).where(eq(adSpendTracker.clientId, clientId))
  return NextResponse.json(trackers)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, month, plannedBudget, platform, dailyPace } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [tracker] = await db.insert(adSpendTracker).values({
    id: crypto.randomUUID(),
    clientId, userId, month, plannedBudget, platform, dailyPace,
  }).returning()

  return NextResponse.json(tracker)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientInteraction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const interactions = await db.select().from(clientInteraction)
    .where(eq(clientInteraction.clientId, clientId))
    .orderBy(desc(clientInteraction.createdAt))
    .limit(50)

  return NextResponse.json(interactions)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, type, description } = body

  const [interaction] = await db.insert(clientInteraction).values({
    id: crypto.randomUUID(),
    clientId,
    userId,
    type,
    description,
  }).returning()

  return NextResponse.json(interaction)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientSatisfaction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const scores = await db.select().from(clientSatisfaction)
    .where(eq(clientSatisfaction.clientId, clientId))
    .orderBy(desc(clientSatisfaction.createdAt))
  return NextResponse.json(scores)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, score, note } = body

  const [item] = await db.insert(clientSatisfaction).values({
    id: crypto.randomUUID(),
    clientId, score, note,
  }).returning()

  return NextResponse.json(item)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientNote } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notes = await db.select().from(clientNote)
    .where(eq(clientNote.clientId, clientId))
    .orderBy(desc(clientNote.createdAt))
  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, content, tag } = body

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [note] = await db.insert(clientNote).values({
    id: crypto.randomUUID(),
    clientId, userId, content, tag,
  }).returning()

  return NextResponse.json(note)
}

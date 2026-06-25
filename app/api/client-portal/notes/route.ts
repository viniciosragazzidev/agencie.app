import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientNote } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const notes = await db.select().from(clientNote)
    .where(eq(clientNote.clientId, clientId))
    .orderBy(desc(clientNote.createdAt))
  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, content, tag } = body

  const [note] = await db.insert(clientNote).values({
    id: crypto.randomUUID(),
    clientId, userId, content, tag,
  }).returning()

  return NextResponse.json(note)
}

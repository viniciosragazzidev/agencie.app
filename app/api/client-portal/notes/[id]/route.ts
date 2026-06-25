import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientNote } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(clientNote).set(body).where(eq(clientNote.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(clientNote).where(eq(clientNote.id, id))
  return NextResponse.json({ ok: true })
}

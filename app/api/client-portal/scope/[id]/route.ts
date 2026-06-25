import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientScope } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(clientScope).set(body).where(eq(clientScope.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(clientScope).where(eq(clientScope.id, id))
  return NextResponse.json({ ok: true })
}

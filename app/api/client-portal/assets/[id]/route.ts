import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(clientAsset).set(body).where(eq(clientAsset.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(clientAsset).where(eq(clientAsset.id, id))
  return NextResponse.json({ ok: true })
}

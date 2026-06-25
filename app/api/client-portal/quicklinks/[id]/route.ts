import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientQuicklink } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(clientQuicklink).where(eq(clientQuicklink.id, id))
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adSpendTracker } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const [existing] = await db.select({ clientId: adSpendTracker.clientId }).from(adSpendTracker).where(eq(adSpendTracker.id, id)).limit(1)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const authorized = await authorizePortalClient(existing.clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [updated] = await db.update(adSpendTracker).set(body).where(eq(adSpendTracker.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [existing] = await db.select({ clientId: adSpendTracker.clientId }).from(adSpendTracker).where(eq(adSpendTracker.id, id)).limit(1)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const authorized = await authorizePortalClient(existing.clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.delete(adSpendTracker).where(eq(adSpendTracker.id, id))
  return NextResponse.json({ ok: true })
}

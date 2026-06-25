import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval, clientInteraction } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { status, clientComment, title, description, fileType, fileUrl } = body

  const [existing] = await db.select({ clientId: approval.clientId }).from(approval).where(eq(approval.id, id)).limit(1)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const authorized = await authorizePortalClient(existing.clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const updateData: Record<string, any> = {}

  if (status) {
    updateData.status = status
    updateData.clientComment = clientComment
    if (status === "approved") updateData.approvedAt = new Date()
  }

  if (title) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (fileType) updateData.fileType = fileType
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl

  const [updated] = await db.update(approval).set(updateData).where(eq(approval.id, id)).returning()

  if (updated && status) {
    await db.insert(clientInteraction).values({
      id: crypto.randomUUID(),
      clientId: updated.clientId,
      userId: updated.userId,
      type: "note",
      description: `Aprovação "${updated.title}" marcada como ${status}`,
      isAutomatic: true,
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [existing] = await db.select({ clientId: approval.clientId }).from(approval).where(eq(approval.id, id)).limit(1)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const authorized = await authorizePortalClient(existing.clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.delete(approval).where(eq(approval.id, id))
  return NextResponse.json({ ok: true })
}

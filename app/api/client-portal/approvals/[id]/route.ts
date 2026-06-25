import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval, clientInteraction } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { status, clientComment } = body

  const [updated] = await db.update(approval).set({
    status,
    clientComment,
    approvedAt: status === "approved" ? new Date() : null,
  }).where(eq(approval.id, id)).returning()

  if (updated) {
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

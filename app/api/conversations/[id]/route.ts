import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/** DELETE /api/conversations/[id] — remove conversation and its messages */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(conversation).where(eq(conversation.id, id))

  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/** PATCH /api/conversations/[id]/ignore — alterna o status de ignorado de uma conversa */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { isIgnored } = await req.json()

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [updated] = await db
    .update(conversation)
    .set({
      isIgnored: Boolean(isIgnored),
      updatedAt: new Date(),
    })
    .where(eq(conversation.id, id))
    .returning()

  return NextResponse.json({ conversation: updated })
}

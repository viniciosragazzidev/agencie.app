import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversation, messageAnnotation } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/** DELETE /api/conversations/[id]/annotations/[annotationId] — remover anotação */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; annotationId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, annotationId } = await params

  const [conv] = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [existing] = await db
    .select()
    .from(messageAnnotation)
    .where(
      and(
        eq(messageAnnotation.id, annotationId),
        eq(messageAnnotation.conversationId, id),
        eq(messageAnnotation.userId, session.user.id)
      )
    )

  if (!existing) return NextResponse.json({ error: "Annotation not found" }, { status: 404 })

  await db
    .delete(messageAnnotation)
    .where(eq(messageAnnotation.id, annotationId))

  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teamMember } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const [updated] = await db
      .update(teamMember)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(teamMember.id, id), eq(teamMember.userId, session.user.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update team member"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const [deleted] = await db
      .delete(teamMember)
      .where(and(eq(teamMember.id, id), eq(teamMember.userId, session.user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete team member"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

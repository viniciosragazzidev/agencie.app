import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { milestone, project } from "@/lib/db/schema"
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

    const [existing] = await db
      .select({ id: milestone.id, projectId: milestone.projectId })
      .from(milestone)
      .where(eq(milestone.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    const [proj] = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, existing.projectId), eq(project.userId, session.user.id)))
      .limit(1)

    if (!proj) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const [updated] = await db
      .update(milestone)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(milestone.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update milestone"
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

    const [existing] = await db
      .select({ id: milestone.id, projectId: milestone.projectId })
      .from(milestone)
      .where(eq(milestone.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    const [proj] = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, existing.projectId), eq(project.userId, session.user.id)))
      .limit(1)

    if (!proj) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.delete(milestone).where(eq(milestone.id, id))

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete milestone"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

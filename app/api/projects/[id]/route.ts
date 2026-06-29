import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { project } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const proj = await db.query.project.findFirst({
      where: and(eq(project.id, id), eq(project.userId, session.user.id)),
      with: {
        client: { columns: { id: true, name: true, contactPhone: true } },
        milestones: {
          orderBy: (m, { asc }) => [asc(m.position)],
        },
        tasks: {
          orderBy: (t, { asc }) => [asc(t.position)],
        },
      },
    })

    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(proj)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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
      .update(project)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update project"
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
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

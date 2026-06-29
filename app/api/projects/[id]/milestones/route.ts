import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { milestone, project } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params

    const [proj] = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
      .limit(1)

    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const milestones = await db.query.milestone.findMany({
      where: eq(milestone.projectId, projectId),
      orderBy: (m, { asc }) => [asc(m.position)],
      with: {
        tasks: true,
      },
    })

    return NextResponse.json(milestones)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch milestones"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await req.json()
    const { title, description, dueDate, position } = body

    if (!title) {
      return NextResponse.json({ error: "title e obrigatorio" }, { status: 400 })
    }

    const [proj] = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
      .limit(1)

    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const [newMilestone] = await db
      .insert(milestone)
      .values({
        id: crypto.randomUUID(),
        projectId,
        userId: session.user.id,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: position || 0,
      })
      .returning()

    return NextResponse.json(newMilestone)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create milestone"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

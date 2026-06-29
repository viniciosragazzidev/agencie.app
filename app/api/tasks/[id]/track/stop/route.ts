import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params
    const body = await req.json()
    const { teamMemberId } = body

    if (!teamMemberId) {
      return NextResponse.json({ error: "teamMemberId obrigatorio" }, { status: 400 })
    }

    const [activeEntry] = await db
      .select()
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.taskId, taskId),
          eq(timeEntry.teamMemberId, teamMemberId),
          isNull(timeEntry.endTime)
        )
      )
      .limit(1)

    if (!activeEntry) {
      return NextResponse.json({ error: "Nenhum timer ativo encontrado" }, { status: 404 })
    }

    const now = new Date()
    const duration = Math.floor((now.getTime() - activeEntry.startTime.getTime()) / 1000)

    const [updated] = await db
      .update(timeEntry)
      .set({ endTime: now, duration })
      .where(eq(timeEntry.id, activeEntry.id))
      .returning()

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to stop timer"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

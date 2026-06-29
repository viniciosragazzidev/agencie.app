import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

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

    if (activeEntry) {
      return NextResponse.json(
        { error: "Timer ja esta rodando", activeEntry },
        { status: 409 }
      )
    }

    const [entry] = await db
      .insert(timeEntry)
      .values({
        id: crypto.randomUUID(),
        taskId,
        teamMemberId,
        userId: session.user.id,
        startTime: new Date(),
      })
      .returning()

    return NextResponse.json(entry)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start timer"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

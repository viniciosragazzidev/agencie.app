import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { onboardingTask } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(onboardingTask).set({
    ...body,
    completedAt: body.isCompleted ? new Date() : null,
  }).where(eq(onboardingTask.id, id)).returning()

  return NextResponse.json(updated)
}

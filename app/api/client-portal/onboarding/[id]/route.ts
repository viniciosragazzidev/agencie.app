import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { onboardingTask } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const [existing] = await db.select({ clientId: onboardingTask.clientId }).from(onboardingTask).where(eq(onboardingTask.id, id)).limit(1)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const authorized = await authorizePortalClient(existing.clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [updated] = await db.update(onboardingTask).set({
    ...body,
    completedAt: body.isCompleted ? new Date() : null,
  }).where(eq(onboardingTask.id, id)).returning()

  return NextResponse.json(updated)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { onboardingTask } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const tasks = await db.select().from(onboardingTask)
    .where(eq(onboardingTask.clientId, clientId))
    .orderBy(asc(onboardingTask.position))
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, title, description, isRequired, position } = body

  const [task] = await db.insert(onboardingTask).values({
    id: crypto.randomUUID(),
    clientId, userId, title, description, isRequired, position,
  }).returning()

  return NextResponse.json(task)
}

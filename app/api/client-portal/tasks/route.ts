import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectTask } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const tasks = await db.select().from(projectTask).where(eq(projectTask.clientId, clientId))
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, title, description, status } = body

  const [task] = await db.insert(projectTask).values({
    id: crypto.randomUUID(),
    clientId,
    userId,
    title,
    description,
    status: status || "todo",
  }).returning()

  return NextResponse.json(task)
}

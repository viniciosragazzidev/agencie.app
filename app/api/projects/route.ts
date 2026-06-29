import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { project, client } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId")

    const conditions = [eq(project.userId, session.user.id)]
    if (clientId) {
      conditions.push(eq(project.clientId, clientId))
    }

    const projects = await db.query.project.findMany({
      where: and(...conditions),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      with: {
        client: { columns: { id: true, name: true } },
        milestones: true,
      },
    })

    return NextResponse.json(projects)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, name, description, budget, startDate, endDate } = body

    if (!clientId || !name) {
      return NextResponse.json(
        { error: "clientId e name sao obrigatorios" },
        { status: 400 }
      )
    }

    const [existingClient] = await db
      .select({ id: client.id })
      .from(client)
      .where(and(eq(client.id, clientId), eq(client.userId, session.user.id)))
      .limit(1)

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const [newProject] = await db
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        clientId,
        userId: session.user.id,
        name,
        description: description || null,
        budget: budget || "0",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      })
      .returning()

    return NextResponse.json(newProject)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

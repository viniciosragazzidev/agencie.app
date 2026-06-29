import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teamMember } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const members = await db.query.teamMember.findMany({
      where: eq(teamMember.userId, session.user.id),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    })

    return NextResponse.json(members)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch team members"
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
    const { name, email, role, hourlyCost, avatar } = body

    if (!name) {
      return NextResponse.json({ error: "name e obrigatorio" }, { status: 400 })
    }

    const [member] = await db
      .insert(teamMember)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name,
        email: email || null,
        role: role || "other",
        hourlyCost: hourlyCost || "0",
        avatar: avatar || null,
      })
      .returning()

    return NextResponse.json(member)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create team member"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

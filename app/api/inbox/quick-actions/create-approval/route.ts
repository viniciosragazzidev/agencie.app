import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval, user } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, title, description, fileUrl, fileType } = body

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const approvalId = crypto.randomUUID()

    const [newApproval] = await db
      .insert(approval)
      .values({
        id: approvalId,
        clientId,
        userId: session.user.id,
        title,
        description: description || null,
        fileUrl: fileUrl || null,
        fileType: fileType || "other",
        status: "pending",
      })
      .returning()

    const [agencyUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const agencyUsername = agencyUser?.username || session.user.id

    return NextResponse.json({
      approval: newApproval,
      portalLink: `/portal/${agencyUsername}/projetos`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create approval" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/** GET /api/integrations — lista todas as integrações do usuário */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const integrations = await db
    .select()
    .from(channelIntegration)
    .where(eq(channelIntegration.userId, session.user.id))
    .orderBy(channelIntegration.createdAt)

  return NextResponse.json({ integrations })
}

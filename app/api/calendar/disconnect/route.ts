import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { googleCalendarCredential } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db
      .delete(googleCalendarCredential)
      .where(eq(googleCalendarCredential.userId, session.user.id))

    return NextResponse.json({ disconnected: true })
  } catch (err: any) {
    console.error("[Calendar Disconnect] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

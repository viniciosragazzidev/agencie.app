import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { googleCalendarCredential } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [credential] = await db
    .select({
      id: googleCalendarCredential.id,
      calendarEmail: googleCalendarCredential.calendarEmail,
      calendarName: googleCalendarCredential.calendarName,
      expiryDate: googleCalendarCredential.expiryDate,
      createdAt: googleCalendarCredential.createdAt,
    })
    .from(googleCalendarCredential)
    .where(eq(googleCalendarCredential.userId, session.user.id))
    .limit(1)

  if (!credential) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    email: credential.calendarEmail,
    name: credential.calendarName,
    expiresAt: credential.expiryDate?.toISOString(),
    connectedAt: credential.createdAt.toISOString(),
  })
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientMeeting } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, clientSuggestedDate, clientComment } = body

    // 1. Fetch meeting to get clientId
    const [meeting] = await db
      .select()
      .from(clientMeeting)
      .where(eq(clientMeeting.id, id))
      .limit(1)

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // 2. Authorize
    const authorized = await authorizePortalClient(meeting.clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 3. Update meeting
    const [updated] = await db
      .update(clientMeeting)
      .set({
        status: status || meeting.status,
        clientSuggestedDate: clientSuggestedDate ? new Date(clientSuggestedDate) : meeting.clientSuggestedDate,
        clientComment: clientComment !== undefined ? clientComment : meeting.clientComment,
        updatedAt: new Date(),
      })
      .where(eq(clientMeeting.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("[PATCH meeting] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

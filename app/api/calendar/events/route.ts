import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createCalendarEvent, listCalendarEvents, deleteCalendarEvent } from "@/lib/integrations/google-calendar"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const maxResults = parseInt(searchParams.get("maxResults") || "20", 10)

    const events = await listCalendarEvents(session.user.id, maxResults)
    if (!events) {
      return NextResponse.json({ connected: false, events: [] })
    }

    return NextResponse.json({ connected: true, events })
  } catch (err: any) {
    console.error("[Calendar Events GET] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { summary, description, startTime, endTime, attendees, conferenceData } = body

    if (!summary || !startTime || !endTime) {
      return NextResponse.json({ error: "summary, startTime, and endTime are required" }, { status: 400 })
    }

    const result = await createCalendarEvent({
      userId: session.user.id,
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
      conferenceData: conferenceData ?? true,
    })

    if (!result) {
      return NextResponse.json({ error: "Google Calendar não conectado. Conecte em Configurações > Integrações." }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[Calendar Events POST] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

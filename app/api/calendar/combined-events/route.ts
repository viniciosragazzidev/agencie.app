import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientMeeting } from "@/lib/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { listCalendarEvents } from "@/lib/integrations/google-calendar"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId")
  const month = searchParams.get("month") // formato "2026-06"
  const includeCalendar = searchParams.get("includeCalendar") !== "false"

  // Definir range do mês
  let monthStart: Date
  let monthEnd: Date

  if (month) {
    const [year, m] = month.split("-").map(Number)
    monthStart = new Date(year, m - 1, 1)
    monthEnd = new Date(year, m, 0, 23, 59, 59)
  } else {
    const now = new Date()
    monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }

  const events: any[] = []

  // 1. Buscar meetings locais
  if (clientId) {
    const meetings = await db
      .select()
      .from(clientMeeting)
      .where(
        and(
          eq(clientMeeting.clientId, clientId),
          gte(clientMeeting.meetingDate, monthStart),
          lte(clientMeeting.meetingDate, monthEnd)
        )
      )

    meetings.forEach((m) => {
      events.push({
        id: `meeting-${m.id}`,
        title: m.title,
        description: m.description || "",
        start: m.meetingDate.toISOString(),
        end: m.meetingDate.toISOString(),
        type: "meeting",
        status: m.status,
        platform: m.platform,
        meetingLink: m.meetingLink,
        clientSuggestedDate: m.clientSuggestedDate?.toISOString() || null,
      })
    })
  }

  // 2. Buscar eventos do Google Calendar
  let googleConnected = false
  if (includeCalendar) {
    try {
      const googleEvents = await listCalendarEvents(session.user.id, 50)
      if (googleEvents) {
        googleConnected = true
        googleEvents.forEach((e) => {
          if (e.start) {
            const eventDate = new Date(e.start)
            if (eventDate >= monthStart && eventDate <= monthEnd) {
              events.push({
                id: `google-${e.id}`,
                title: e.summary || "Evento sem título",
                description: e.description || "",
                start: e.start,
                end: e.end || e.start,
                type: "google",
                htmlLink: e.htmlLink,
                hangoutLink: e.hangoutLink,
                creator: e.creator,
              })
            }
          }
        })
      }
    } catch {
      // Google Calendar não conectado ou erro - apenas ignora
    }
  }

  // Ordenar por data
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return NextResponse.json({
    events,
    googleConnected,
    month: month || `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
  })
}

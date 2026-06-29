import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientMeeting, client, channelIntegration, clientPoll } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"
import { sendWppPollMessage } from "@/lib/integrations/openwa"
import { createCalendarEvent } from "@/lib/integrations/google-calendar"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const meetings = await db
    .select()
    .from(clientMeeting)
    .where(eq(clientMeeting.clientId, clientId))
  return NextResponse.json(meetings)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, userId, title, description, meetingDate, platform, meetingLink, sendAsWppPoll, createCalendarEvent: shouldCreateCalendarEvent, clientEmail } = body

    if (!clientId || !userId || !title || !meetingDate) {
      return NextResponse.json({ error: "clientId, userId, title, and meetingDate are required" }, { status: 400 })
    }

    const authorized = await authorizePortalClient(clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const meetingId = crypto.randomUUID()
    const [meeting] = await db.insert(clientMeeting).values({
      id: meetingId,
      clientId,
      userId,
      title,
      description: description || null,
      meetingDate: new Date(meetingDate),
      platform: platform || "Google Meet",
      meetingLink: meetingLink || null,
      status: "pending",
    }).returning()

    // Se solicitado, cria evento no Google Calendar com Google Meet
    let calendarEventResult: any = null
    if (shouldCreateCalendarEvent) {
      try {
        const startTime = new Date(meetingDate)
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1h de duração

        calendarEventResult = await createCalendarEvent({
          userId,
          summary: title,
          description: description || `Reunião com cliente via Agencie`,
          startTime,
          endTime,
          attendees: clientEmail ? [clientEmail] : undefined,
          conferenceData: platform === "Google Meet",
        })

        if (calendarEventResult) {
          // Atualizar o meeting com o link do Google Meet
          await db
            .update(clientMeeting)
            .set({
              meetingLink: calendarEventResult.hangoutLink || calendarEventResult.htmlLink || meeting.meetingLink,
              updatedAt: new Date(),
            })
            .where(eq(clientMeeting.id, meetingId))

          meeting.meetingLink = calendarEventResult.hangoutLink || calendarEventResult.htmlLink || meeting.meetingLink
        }
      } catch (calErr) {
        console.error("[POST meetings] Google Calendar error:", calErr)
        // Não falha a criação da reunião por causa do calendário
      }
    }

    if (sendAsWppPoll) {
      try {
        const [clientRecord] = await db
          .select()
          .from(client)
          .where(eq(client.id, clientId))

        if (clientRecord && clientRecord.contactPhone) {
          const [integration] = await db
            .select()
            .from(channelIntegration)
            .where(
              and(
                eq(channelIntegration.userId, userId),
                eq(channelIntegration.channel, "whatsapp"),
                eq(channelIntegration.status, "active")
              )
            )

          if (integration) {
            const phoneDigits = clientRecord.contactPhone.replace(/\D/g, "")
            const cleanPhone = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`

            // Format date for display in the poll option/title
            const formattedDate = new Date(meetingDate).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })

            const pollName = `Confirmar Call: ${title} (${formattedDate})?`
            const options = ["Confirmar Call 👍", "Não, preciso alterar 📅"]

            const wppRes = await sendWppPollMessage(
              integration.externalId,
              cleanPhone,
              pollName,
              options
            )

            if (wppRes && wppRes.messageId) {
              await db.insert(clientPoll).values({
                id: crypto.randomUUID(),
                clientId,
                userId,
                messageId: wppRes.messageId,
                externalMessageId: wppRes.messageId,
                pollName,
                type: "meeting_confirmation",
                referenceId: meetingId,
                options,
              })
            }
          }
        }
      } catch (wppErr) {
        console.error("[POST meetings] WhatsApp poll sending error:", wppErr)
      }
    }

    return NextResponse.json(meeting)
  } catch (err: any) {
    console.error("[POST meetings] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

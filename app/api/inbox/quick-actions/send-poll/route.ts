import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientPoll, client, channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { sendWppPollMessage } from "@/lib/integrations/openwa"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { clientId, pollName, options, type, referenceId, contactPhone } = body

    if (!pollName || !options || !Array.isArray(options) || !type) {
      return NextResponse.json({ error: "pollName, options (array), and type are required" }, { status: 400 })
    }

    const userId = session.user.id

    // 1. Resolve phone number
    let finalPhone = ""
    if (clientId) {
      const [clientRecord] = await db
        .select()
        .from(client)
        .where(and(eq(client.id, clientId), eq(client.userId, userId)))
        .limit(1)

      if (clientRecord) {
        finalPhone = clientRecord.contactPhone || ""
      }
    } else if (contactPhone) {
      finalPhone = contactPhone
    }

    if (!finalPhone) {
      return NextResponse.json({ error: "Phone number could not be resolved" }, { status: 400 })
    }

    // 2. Fetch active whatsapp integration
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
      .limit(1)

    if (!integration) {
      return NextResponse.json({ error: "No active WhatsApp integration found" }, { status: 400 })
    }

    const phoneDigits = finalPhone.replace(/\D/g, "")
    const cleanPhone = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`

    // 3. Send Poll message via OpenWA
    const wppRes = await sendWppPollMessage(
      integration.externalId,
      cleanPhone,
      pollName,
      options
    )

    if (!wppRes || !wppRes.messageId) {
      return NextResponse.json({ error: "Failed to send poll via WhatsApp" }, { status: 502 })
    }

    // 4. Save to db
    const [poll] = await db
      .insert(clientPoll)
      .values({
        id: crypto.randomUUID(),
        clientId: clientId || null,
        userId,
        messageId: wppRes.messageId,
        externalMessageId: wppRes.messageId,
        pollName,
        type,
        referenceId: referenceId || null,
        options,
      })
      .returning()

    return NextResponse.json({ success: true, poll })
  } catch (err: any) {
    console.error("[POST send-poll] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

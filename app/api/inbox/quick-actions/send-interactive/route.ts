import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, channelIntegration } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { sendWppInteractiveMessage } from "@/lib/integrations/openwa"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { clientId, messageBody, buttonText, sections, contactPhone } = body

    if (!messageBody || !buttonText || !sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "messageBody, buttonText, and sections (array) are required" }, { status: 400 })
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

    // 3. Send Interactive message via OpenWA
    const wppRes = await sendWppInteractiveMessage(
      integration.externalId,
      cleanPhone,
      messageBody,
      buttonText,
      sections
    )

    if (!wppRes || !wppRes.messageId) {
      return NextResponse.json({ error: "Failed to send interactive message via WhatsApp" }, { status: 502 })
    }

    return NextResponse.json({ success: true, messageId: wppRes.messageId })
  } catch (err: any) {
    console.error("[POST send-interactive] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

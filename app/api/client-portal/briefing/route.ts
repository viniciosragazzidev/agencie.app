import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientBriefing, client } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const briefings = await db
    .select()
    .from(clientBriefing)
    .where(eq(clientBriefing.clientId, clientId))
    .orderBy(desc(clientBriefing.createdAt))
    .limit(1)

  return NextResponse.json(briefings[0] || null)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      clientId,
      userId,
      projectName,
      businessGoal,
      targetAudience,
      targetAge,
      targetLocation,
      competitors,
      projectScope,
      estimatedBudget,
      desiredDeadline,
      visualReferences,
      additionalInfo,
      submit,
    } = body

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }

    const authorized = await authorizePortalClient(clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Resolve userId from the client record when called from portal (where userId may be empty)
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const [clientRecord] = await db
        .select({ userId: client.userId })
        .from(client)
        .where(eq(client.id, clientId))
        .limit(1)
      if (!clientRecord) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
      resolvedUserId = clientRecord.userId
    }

    // Check if a briefing already exists for this client
    const [existing] = await db
      .select({ id: clientBriefing.id })
      .from(clientBriefing)
      .where(eq(clientBriefing.clientId, clientId))
      .limit(1)

    const isSubmit = submit === true

    if (existing) {
      // Update existing briefing
      const [updated] = await db
        .update(clientBriefing)
        .set({
          projectName: projectName ?? undefined,
          businessGoal: businessGoal ?? undefined,
          targetAudience: targetAudience ?? undefined,
          targetAge: targetAge ?? undefined,
          targetLocation: targetLocation ?? undefined,
          competitors: competitors ?? undefined,
          projectScope: projectScope ?? undefined,
          estimatedBudget: estimatedBudget ?? undefined,
          desiredDeadline: desiredDeadline ?? undefined,
          visualReferences: visualReferences ?? undefined,
          additionalInfo: additionalInfo ?? undefined,
          status: isSubmit ? "submitted" : "draft",
          submittedAt: isSubmit ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(clientBriefing.id, existing.id))
        .returning()

      return NextResponse.json(updated)
    } else {
      // Create new briefing
      const [briefing] = await db
        .insert(clientBriefing)
        .values({
          id: crypto.randomUUID(),
          clientId,
          userId: resolvedUserId,
          projectName: projectName || null,
          businessGoal: businessGoal || null,
          targetAudience: targetAudience || null,
          targetAge: targetAge || null,
          targetLocation: targetLocation || null,
          competitors: competitors || null,
          projectScope: projectScope || null,
          estimatedBudget: estimatedBudget || null,
          desiredDeadline: desiredDeadline || null,
          visualReferences: visualReferences || null,
          additionalInfo: additionalInfo || null,
          status: isSubmit ? "submitted" : "draft",
          submittedAt: isSubmit ? new Date() : null,
        })
        .returning()

      return NextResponse.json(briefing)
    }
  } catch (err: any) {
    console.error("[POST briefing] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

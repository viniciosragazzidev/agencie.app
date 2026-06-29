import { redirect, notFound } from "next/navigation"
import { getPortalClient } from "@/lib/portal-auth"
import { db } from "@/lib/db"
import { clientBriefing } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import BriefingView from "./briefing-view"

type Params = Promise<{ agency: string; id: string }>

export default async function PortalBriefingPage({ params }: { params: Params }) {
  const { agency, id } = await params
  const portal = await getPortalClient()

  if (!portal || portal.agencyId !== agency) {
    redirect(`/portal/${agency}`)
  }

  if (portal.clientId !== id) {
    redirect(`/portal/${agency}`)
  }

  // Fetch existing briefing data if any
  const [briefing] = await db
    .select()
    .from(clientBriefing)
    .where(
      and(
        eq(clientBriefing.clientId, portal.clientId),
        eq(clientBriefing.status, "submitted")
      )
    )
    .limit(1)

  // Also fetch draft if no submitted version exists
  let initialData = briefing
  if (!initialData) {
    const [draft] = await db
      .select()
      .from(clientBriefing)
      .where(
        and(
          eq(clientBriefing.clientId, portal.clientId),
          eq(clientBriefing.status, "draft")
        )
      )
      .limit(1)
    initialData = draft || null
  }

  return (
    <BriefingView
      agencySlug={agency}
      clientId={portal.clientId}
      initialData={initialData ? {
        id: initialData.id,
        projectName: initialData.projectName,
        businessGoal: initialData.businessGoal,
        targetAudience: initialData.targetAudience,
        targetAge: initialData.targetAge,
        targetLocation: initialData.targetLocation,
        competitors: initialData.competitors,
        projectScope: initialData.projectScope,
        estimatedBudget: initialData.estimatedBudget,
        desiredDeadline: initialData.desiredDeadline,
        visualReferences: initialData.visualReferences,
        additionalInfo: initialData.additionalInfo,
        status: initialData.status,
      } : null}
    />
  )
}

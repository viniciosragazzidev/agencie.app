import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  client,
  projectTask,
  approval,
  clientInteraction,
  clientMeeting,
  clientContract,
  clientScope,
  onboardingTask,
} from "@/lib/db/schema"
import { eq, and, gte, lte, or } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const now = new Date()

    const clientsList = await db.query.client.findMany({
      where: eq(client.userId, userId),
    })

    const pendingTasks = await db.query.projectTask.findMany({
      where: and(
        eq(projectTask.userId, userId),
        or(
          eq(projectTask.status, "todo"),
          eq(projectTask.status, "in_progress")
        )
      ),
      with: { client: { columns: { id: true, name: true } } },
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
    })

    const pendingApprovals = await db.query.approval.findMany({
      where: and(
        eq(approval.userId, userId),
        eq(approval.status, "pending")
      ),
      with: { client: { columns: { id: true, name: true } } },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    })

    const upcomingMeetings = await db.query.clientMeeting.findMany({
      where: and(
        eq(clientMeeting.userId, userId),
        eq(clientMeeting.status, "pending"),
        gte(clientMeeting.meetingDate, now),
        lte(clientMeeting.meetingDate, new Date(now.getTime() + 7 * 86400000))
      ),
      with: { client: { columns: { id: true, name: true } } },
      orderBy: (m, { asc }) => [asc(m.meetingDate)],
    })

    const clientsWithoutInteraction: Array<{
      clientId: string
      clientName: string
      clientStatus: string
      daysSinceContact: number | null
      severity: "critical" | "warning"
    }> = []
    for (const c of clientsList) {
      const lastInteraction = await db.query.clientInteraction.findFirst({
        where: eq(clientInteraction.clientId, c.id),
        orderBy: (i, { desc }) => [desc(i.createdAt)],
      })
      const daysSinceContact = lastInteraction
        ? Math.floor(
            (now.getTime() - new Date(lastInteraction.createdAt).getTime()) /
              86400000
          )
        : null

      if (daysSinceContact === null || daysSinceContact > 7) {
        clientsWithoutInteraction.push({
          clientId: c.id,
          clientName: c.name,
          clientStatus: c.status,
          daysSinceContact,
          severity:
            daysSinceContact === null || daysSinceContact > 14
              ? "critical"
              : "warning",
        })
      }
    }

    const unsignedContracts = await db.query.clientContract.findMany({
      where: and(
        eq(clientContract.userId, userId),
        eq(clientContract.status, "pending")
      ),
      with: { client: { columns: { id: true, name: true } } },
    })

    const onboardingClientsData: Array<{
      clientId: string
      clientName: string
      totalTasks: number
      completedTasks: number
      percent: number
    }> = []
    for (const c of clientsList.filter((c) => c.status === "Onboarding")) {
      const tasks = await db.query.onboardingTask.findMany({
        where: eq(onboardingTask.clientId, c.id),
      })
      const done = tasks.filter((t) => t.isCompleted).length
      onboardingClientsData.push({
        clientId: c.id,
        clientName: c.name,
        totalTasks: tasks.length,
        completedTasks: done,
        percent:
          tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
      })
    }

    const scopeAlerts = await db.query.clientScope.findMany({
      where: and(
        eq(clientScope.userId, userId),
        eq(clientScope.status, "active")
      ),
      with: { client: { columns: { id: true, name: true } } },
    })
    const highScopeUsage = scopeAlerts
      .filter(
        (s) => s.totalQuota > 0 && s.usedQuota / s.totalQuota > 0.8
      )
      .map((s) => ({
        clientId: s.client.id,
        clientName: s.client.name,
        scopeLabel: s.label,
        usedQuota: s.usedQuota,
        totalQuota: s.totalQuota,
        percent: Math.round((s.usedQuota / s.totalQuota) * 100),
      }))

    interface PriorityItem {
      id: string
      type: string
      priority: "critical" | "high" | "medium" | "low"
      clientId: string
      clientName: string
      label: string
      action: string
      meetingDate?: Date
    }

    let itemIdCounter = 0
    const makeId = () => `prio-${++itemIdCounter}`

    const priorityItems: PriorityItem[] = []

    clientsWithoutInteraction
      .filter((c) => c.severity === "critical")
      .forEach((c) => {
        priorityItems.push({
          id: makeId(),
          type: "churn_risk",
          priority: "critical",
          clientId: c.clientId,
          clientName: c.clientName,
          label:
            c.daysSinceContact !== null
              ? `Sem contato ha ${c.daysSinceContact} dias`
              : "Nunca foi contatado",
          action: "inbox",
        })
      })

    pendingApprovals.forEach((a) => {
      priorityItems.push({
        id: makeId(),
        type: "pending_approval",
        priority: "high",
        clientId: a.client.id,
        clientName: a.client.name,
        label: a.title,
        action: "approval",
      })
    })

    unsignedContracts.forEach((c) => {
      priorityItems.push({
        id: makeId(),
        type: "unsigned_contract",
        priority: "high",
        clientId: c.client.id,
        clientName: c.client.name,
        label: c.title,
        action: "contract",
      })
    })

    highScopeUsage.forEach((s) => {
      priorityItems.push({
        id: makeId(),
        type: "scope_alert",
        priority: "high",
        clientId: s.clientId,
        clientName: s.clientName,
        label: `${s.scopeLabel} em ${s.percent}%`,
        action: "scope",
      })
    })

    upcomingMeetings.forEach((m) => {
      priorityItems.push({
        id: makeId(),
        type: "upcoming_meeting",
        priority: "medium",
        clientId: m.client.id,
        clientName: m.client.name,
        label: m.title,
        meetingDate: m.meetingDate,
        action: "meeting",
      })
    })

    clientsWithoutInteraction
      .filter((c) => c.severity === "warning")
      .forEach((c) => {
        priorityItems.push({
          id: makeId(),
          type: "churn_risk",
          priority: "medium",
          clientId: c.clientId,
          clientName: c.clientName,
          label: `Sem contato ha ${c.daysSinceContact} dias`,
          action: "inbox",
        })
      })

    onboardingClientsData
      .filter((o) => o.percent < 100)
      .forEach((o) => {
        priorityItems.push({
          id: makeId(),
          type: "onboarding_incomplete",
          priority: "low",
          clientId: o.clientId,
          clientName: o.clientName,
          label: `${o.percent}% do onboarding concluido`,
          action: "onboarding",
        })
      })

    return NextResponse.json({
      priorityItems,
      pendingTasksCount: pendingTasks.length,
      pendingApprovalsCount: pendingApprovals.length,
      upcomingMeetingsCount: upcomingMeetings.length,
      churnRiskCount: clientsWithoutInteraction.length,
      onboardingCount: onboardingClientsData.filter((o) => o.percent < 100)
        .length,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch focus data"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

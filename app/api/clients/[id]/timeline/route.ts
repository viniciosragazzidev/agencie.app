import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  clientInteraction,
  clientNote,
  approval,
  projectTask,
  clientMeeting,
  clientContract,
  clientBriefing,
  clientAsset,
  onboardingTask,
  clientSatisfaction,
  project,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clientId } = await params

    const [
      interactions,
      notes,
      approvals,
      tasks,
      meetings,
      contracts,
      briefings,
      assets,
      onboardingTasks,
      satisfaction,
      projects,
    ] = await Promise.all([
      db.query.clientInteraction.findMany({
        where: eq(clientInteraction.clientId, clientId),
        orderBy: (i, { desc }) => [desc(i.createdAt)],
        limit: 20,
      }),
      db.query.clientNote.findMany({
        where: eq(clientNote.clientId, clientId),
        orderBy: (n, { desc }) => [desc(n.createdAt)],
        limit: 20,
      }),
      db.query.approval.findMany({
        where: eq(approval.clientId, clientId),
        orderBy: (a, { desc }) => [desc(a.createdAt)],
        limit: 20,
      }),
      db.query.projectTask.findMany({
        where: eq(projectTask.clientId, clientId),
        orderBy: (t, { desc }) => [desc(t.updatedAt)],
        limit: 20,
      }),
      db.query.clientMeeting.findMany({
        where: eq(clientMeeting.clientId, clientId),
        orderBy: (m, { desc }) => [desc(m.createdAt)],
        limit: 10,
      }),
      db.query.clientContract.findMany({
        where: eq(clientContract.clientId, clientId),
        orderBy: (c, { desc }) => [desc(c.createdAt)],
        limit: 10,
      }),
      db.query.clientBriefing.findMany({
        where: eq(clientBriefing.clientId, clientId),
        orderBy: (b, { desc }) => [desc(b.createdAt)],
        limit: 10,
      }),
      db.query.clientAsset.findMany({
        where: eq(clientAsset.clientId, clientId),
        orderBy: (a, { desc }) => [desc(a.createdAt)],
        limit: 10,
      }),
      db.query.onboardingTask.findMany({
        where: eq(onboardingTask.clientId, clientId),
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: 20,
      }),
      db.query.clientSatisfaction.findMany({
        where: eq(clientSatisfaction.clientId, clientId),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        limit: 10,
      }),
      db.query.project.findMany({
        where: eq(project.clientId, clientId),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
        limit: 10,
      }),
    ])

    interface TimelineItem {
      id: string
      type: string
      subtype: string
      description: string | null
      date: Date
      userId: string
    }

    const timeline: TimelineItem[] = [
      ...interactions.map((i) => ({
        id: i.id,
        type: "interaction",
        subtype: i.type,
        description: i.description,
        date: i.createdAt,
        userId: i.userId,
      })),
      ...notes.map((n) => ({
        id: n.id,
        type: "note",
        subtype: n.tag,
        description: n.content,
        date: n.createdAt,
        userId: n.userId,
      })),
      ...approvals.map((a) => ({
        id: a.id,
        type: "approval",
        subtype: a.status,
        description: `${a.title} — ${
          a.status === "approved"
            ? "Aprovado"
            : a.status === "revision"
              ? "Em revisao"
              : "Pendente"
        }`,
        date: a.createdAt,
        userId: a.userId,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: "task",
        subtype: t.status,
        description: `${t.title} — ${
          t.status === "done"
            ? "Concluido"
            : t.status === "in_progress"
              ? "Em andamento"
              : "A fazer"
        }`,
        date: t.updatedAt,
        userId: t.userId,
      })),
      ...meetings.map((m) => ({
        id: m.id,
        type: "meeting",
        subtype: m.status,
        description: `${m.title} — ${new Date(m.meetingDate).toLocaleDateString("pt-BR")}`,
        date: m.createdAt,
        userId: m.userId,
      })),
      ...contracts.map((c) => ({
        id: c.id,
        type: "contract",
        subtype: c.status,
        description: `${c.title} — ${
          c.status === "signed"
            ? "Assinado"
            : c.status === "pending"
              ? "Pendente"
              : c.status
        }`,
        date: c.createdAt,
        userId: c.userId,
      })),
      ...briefings.map((b) => ({
        id: b.id,
        type: "briefing",
        subtype: b.status,
        description: b.projectName || "Briefing",
        date: b.createdAt,
        userId: b.userId,
      })),
      ...assets.map((a) => ({
        id: a.id,
        type: "asset",
        subtype: a.category,
        description: a.name,
        date: a.createdAt,
        userId: a.userId,
      })),
      ...onboardingTasks.map((o) => ({
        id: o.id,
        type: "onboarding",
        subtype: o.isCompleted ? "completed" : "pending",
        description: `${o.title}${o.isCompleted ? " (concluido)" : ""}`,
        date: o.createdAt,
        userId: o.userId,
      })),
      ...satisfaction.map((s) => ({
        id: s.id,
        type: "satisfaction",
        subtype: "score",
        description: `Nota: ${s.score}/5${s.note ? ` — ${s.note}` : ""}`,
        date: s.createdAt,
        userId: "",
      })),
      ...projects.map((p) => ({
        id: p.id,
        type: "project",
        subtype: p.status,
        description: `${p.name} — ${p.status}`,
        date: p.createdAt,
        userId: p.userId,
      })),
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({ timeline })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch timeline"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { project, client, projectTask, timeEntry, teamMember } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const margins = await db
      .select({
        projectId: project.id,
        projectName: project.name,
        clientName: client.name,
        budget: project.budget,
        memberId: teamMember.id,
        memberName: teamMember.name,
        hourlyCost: teamMember.hourlyCost,
        totalDuration: sql<number>`COALESCE(SUM(${timeEntry.duration}), 0)`,
      })
      .from(project)
      .innerJoin(client, eq(project.clientId, client.id))
      .leftJoin(projectTask, eq(projectTask.projectId, project.id))
      .leftJoin(timeEntry, eq(timeEntry.taskId, projectTask.id))
      .leftJoin(teamMember, eq(timeEntry.teamMemberId, teamMember.id))
      .where(eq(project.userId, userId))
      .groupBy(
        project.id, project.name, client.name, project.budget,
        teamMember.id, teamMember.name, teamMember.hourlyCost
      )

    const projectMap = new Map<string, {
      projectId: string
      projectName: string
      clientName: string
      budget: number
      totalHours: number
      costByMember: Array<{
        memberName: string
        hours: number
        hourlyCost: number
        totalCost: number
      }>
      totalCost: number
      profitMargin: number
      profitValue: number
    }>()

    for (const row of margins) {
      if (!projectMap.has(row.projectId)) {
        projectMap.set(row.projectId, {
          projectId: row.projectId,
          projectName: row.projectName,
          clientName: row.clientName,
          budget: parseFloat(row.budget) || 0,
          totalHours: 0,
          costByMember: [],
          totalCost: 0,
          profitMargin: 0,
          profitValue: 0,
        })
      }

      const proj = projectMap.get(row.projectId)!
      const hours = (row.totalDuration || 0) / 3600
      const cost = hours * (parseFloat(row.hourlyCost || "0") || 0)

      proj.totalHours += hours

      if (row.memberId) {
        const existing = proj.costByMember.find(m => m.memberName === row.memberName)
        if (existing) {
          existing.hours += hours
          existing.totalCost += cost
        } else {
          proj.costByMember.push({
            memberName: row.memberName || "Desconhecido",
            hours,
            hourlyCost: parseFloat(row.hourlyCost || "0") || 0,
            totalCost: cost,
          })
        }
      }
    }

    const result = Array.from(projectMap.values()).map(proj => {
      proj.totalCost = proj.costByMember.reduce((sum, m) => sum + m.totalCost, 0)
      proj.profitValue = proj.budget - proj.totalCost
      proj.profitMargin = proj.budget > 0
        ? Math.round((proj.profitValue / proj.budget) * 1000) / 10
        : 0
      return proj
    })

    result.sort((a, b) => b.profitMargin - a.profitMargin)

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate profit margins"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

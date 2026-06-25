import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, clientInteraction, clientSatisfaction, clientFinancialRecord, lead } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
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

    // 1. Buscar todos os clientes do usuário
    const clientsList = await db.query.client.findMany({
      where: eq(client.userId, userId),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    })

    // 2. Calcular MRR total
    const totalMRR = clientsList.reduce((sum, c) => sum + (parseFloat(c.mrr) || 0), 0)

    // 3. Clientes ativos vs total
    const activeClients = clientsList.filter(c => c.status === "Ativo").length
    const totalClients = clientsList.length
    const atRiskClients = clientsList.filter(c => c.status === "Em Risco").length
    const onboardingClients = clientsList.filter(c => c.status === "Onboarding").length

    // 4. Buscar últimas interações por cliente (para activity feed)
    const recentInteractions = await db.query.clientInteraction.findMany({
      where: eq(clientInteraction.userId, userId),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
      limit: 10,
    })

    // 5. Buscar scores de satisfação com nome do cliente
    const satisfactionWithNames = await db
      .select({
        id: clientSatisfaction.id,
        clientId: clientSatisfaction.clientId,
        clientName: client.name,
        score: clientSatisfaction.score,
        note: clientSatisfaction.note,
        createdAt: clientSatisfaction.createdAt,
      })
      .from(clientSatisfaction)
      .innerJoin(client, eq(clientSatisfaction.clientId, client.id))
      .where(eq(client.userId, userId))
      .orderBy(desc(clientSatisfaction.createdAt))
      .limit(20)

    // 6. Média de satisfação
    const avgSatisfaction = satisfactionWithNames.length > 0
      ? satisfactionWithNames.reduce((sum, s) => sum + s.score, 0) / satisfactionWithNames.length
      : 0

    // 7. Último score por cliente (para NPS por cliente)
    const latestScoresByClient = satisfactionWithNames.reduce((acc, s) => {
      if (!acc[s.clientId]) acc[s.clientId] = s
      return acc
    }, {} as Record<string, typeof satisfactionWithNames[0]>)

    // 8. Buscar registros financeiros para cálculo de LTV/CAC
    const financialRecords = await db
      .select({
        revenue: clientFinancialRecord.revenue,
        spend: clientFinancialRecord.spend,
      })
      .from(clientFinancialRecord)
      .innerJoin(client, eq(clientFinancialRecord.clientId, client.id))
      .where(eq(client.userId, userId))

    const totalRevenue = financialRecords.reduce((sum, r) => sum + r.revenue, 0)
    const totalSpend = financialRecords.reduce((sum, r) => sum + r.spend, 0)
    const ltvCacRatio = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 10) / 10 : 0

    // 9. Buscar leads para cálculo de conversão
    const leadsList = await db.query.lead.findMany({
      where: eq(lead.userId, userId),
    })
    const totalLeads = leadsList.length
    const wonLeads = leadsList.filter(l => l.status === "won").length
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0

    return NextResponse.json({
      mrr: totalMRR,
      totalClients,
      activeClients,
      atRiskClients,
      onboardingClients,
      recentInteractions: recentInteractions.map(i => ({
        id: i.id,
        type: i.type,
        description: i.description,
        createdAt: i.createdAt,
      })),
      satisfactionScores: Object.values(latestScoresByClient).map(s => ({
        id: s.clientId,
        name: s.clientName,
        score: s.score,
      })),
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      ltvCacRatio,
      conversionRate,
      clients: clientsList.map(c => ({ id: c.id, name: c.name })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

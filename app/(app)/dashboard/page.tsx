"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  ChartUpIcon,
  FavouriteIcon,
  UserGroupIcon,
  Target01Icon,
  ZapIcon,
  Download01Icon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChurnAlertCard } from "@/components/churn-alert-card"
import { FocusCenter } from "@/components/focus-center"
import { authClient } from "@/lib/auth-client"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

interface DashboardData {
  mrr: number
  totalClients: number
  activeClients: number
  atRiskClients: number
  onboardingClients: number
  recentInteractions: {
    id: string
    type: string
    description: string | null
    createdAt: string
  }[]
  satisfactionScores: { id: string; name: string; score: number }[]
  avgSatisfaction: number
  ltvCacRatio: number
  conversionRate: number
  clients: { id: string; name: string }[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Agora"
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const npsChartConfig = {
  score: {
    label: "NPS",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: session } = authClient.useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [churnAlerts, setChurnAlerts] = useState<
    { clientId: string; clientName: string; daysSinceContact: number; severity: "warning" | "critical" }[]
  >([])

  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignClient, setCampaignClient] = useState("")
  const [campaignPlatform, setCampaignPlatform] = useState("meta")
  const [campaignMonth, setCampaignMonth] = useState("")
  const [campaignBudget, setCampaignBudget] = useState("")
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [view, setView] = useState<"focus" | "overview">("focus")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleGenerateReport = () => {
    window.open("/api/reports", "_blank")
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignClient || !campaignMonth.trim() || !campaignBudget.trim()) return
    setCreatingCampaign(true)
    try {
      const res = await fetch("/api/client-portal/ad-spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: campaignClient,
          userId: session?.user?.id || "",
          month: campaignMonth,
          plannedBudget: campaignBudget,
          platform: campaignPlatform,
          dailyPace: "0.0",
        }),
      })
      if (res.ok) {
        setCampaignMonth("")
        setCampaignBudget("")
        setShowCampaignModal(false)
        triggerToast("Campanha criada com sucesso!")
      } else {
        triggerToast("Erro ao criar campanha.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao criar campanha.", "error")
    } finally {
      setCreatingCampaign(false)
    }
  }

  useGSAP(() => {
    if (loading || !dashboardData || view !== "overview") return

    gsap.to(".dashboard-content", {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    })
    gsap.to(".hero-text", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      stagger: 0.06,
      delay: 0.1,
    })
    gsap.to(".dash-card", {
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.04,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      delay: 0.15,
    })
  }, { scope: containerRef, dependencies: [loading, dashboardData, view] })

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch(`/api/client-portal/churn-alerts?userId=${userId}`).then(r => r.json()),
    ])
      .then(([data, alerts]) => {
        setDashboardData(data)
        setChurnAlerts(alerts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  const data = dashboardData || {
    mrr: 0,
    totalClients: 0,
    activeClients: 0,
    atRiskClients: 0,
    onboardingClients: 0,
    recentInteractions: [],
    satisfactionScores: [],
    avgSatisfaction: 0,
    ltvCacRatio: 0,
    conversionRate: 0,
    clients: []
  }
  const { mrr, totalClients, activeClients, atRiskClients, onboardingClients, recentInteractions, satisfactionScores, avgSatisfaction, ltvCacRatio, conversionRate, clients } = data

  const npsChartData = satisfactionScores.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    score: c.score,
    fill: c.score >= 4 ? "#22c55e" : c.score >= 3 ? "#f59e0b" : "#ef4444",
  }))

  return (
    <div ref={containerRef} className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background select-none">
      {loading || !dashboardData ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-muted-foreground animate-pulse">Carregando dashboard...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 px-4 md:px-5 lg:px-6 pt-3 border-b border-border/30">
            <button
              onClick={() => setView("focus")}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-t-lg transition-all duration-300 cursor-pointer ${
                view === "focus"
                  ? "bg-muted/40 text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Foco do Dia
            </button>
            <button
              onClick={() => setView("overview")}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-t-lg transition-all duration-300 cursor-pointer ${
                view === "overview"
                  ? "bg-muted/40 text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visao Geral
            </button>
          </div>

          {view === "focus" ? (
            <FocusCenter />
          ) : (
          <main className="dashboard-content opacity-0 flex-1 flex flex-col p-4 md:p-5 lg:p-6 max-w-[1500px] w-full mx-auto overflow-y-auto overflow-x-hidden no-scrollbar">

            {/* Header */}
            <section className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border/40">
              <div>
                <div className="hero-text opacity-0 -translate-y-2 flex items-center gap-2 mb-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Control Center · Receita Recorrente
                  </p>
                </div>
                <h1 className="hero-text opacity-0 -translate-y-2 text-2xl md:text-3xl font-display font-medium leading-none tracking-tight text-foreground">
                  R$ <NumberTicker value={mrr} />
                  <span className="text-muted-foreground/40 text-base font-normal tracking-normal ml-1">
                    /mês
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateReport}
                  variant="outline"
                  className="text-xs h-8 gap-1.5 border-border/40 hover:bg-muted font-medium active:scale-[0.98] transition-all duration-300"
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                  Gerar Relatório
                </Button>
                <Button
                  onClick={() => setShowCampaignModal(true)}
                  className="text-xs h-8 gap-1.5 active:scale-[0.98] transition-all duration-300 font-semibold"
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  Nova Campanha
                </Button>
              </div>
            </section>

            {/* KPI Grid */}
            <section data-tour="dashboard-kpis" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 pb-5">
              {/* KPI 1: Total de Clientes */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[11px] font-medium text-muted-foreground">Total de Clientes</CardTitle>
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-display font-medium tracking-tight text-foreground">
                    <NumberTicker value={totalClients} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                      <NumberTicker value={activeClients} /> Ativos
                    </Badge>
                    {atRiskClients > 0 && (
                      <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                        <NumberTicker value={atRiskClients} /> Risco
                      </Badge>
                    )}
                    {onboardingClients > 0 && (
                      <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-amber-500 border-amber-500/30">
                        <NumberTicker value={onboardingClients} /> Onb.
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* KPI 2: Churn Risk */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[11px] font-medium text-muted-foreground">Exposição a Churn</CardTitle>
                    <div className="size-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-3.5 text-destructive" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-display font-medium tracking-tight text-foreground">
                      <NumberTicker value={churnAlerts.length} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">contas</span>
                  </div>
                  <div className="mt-1.5">
                    {churnAlerts.length > 0 ? (
                      <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">Ação Requerida</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Saudável</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* KPI 3: NPS Médio */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[11px] font-medium text-muted-foreground">Satisfação (NPS)</CardTitle>
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {avgSatisfaction > 0 ? <NumberTicker value={avgSatisfaction} format={(v) => v.toFixed(1)} /> : "—"}
                    {avgSatisfaction > 0 && <span className="text-sm text-muted-foreground/40">/5</span>}
                  </div>
                  <div className="mt-1.5">
                    {avgSatisfaction >= 4 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Excelente</Badge>
                    ) : avgSatisfaction >= 3 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-amber-500">Neutro</Badge>
                    ) : avgSatisfaction > 0 ? (
                      <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">Crítico</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4">Sem dados</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* KPI 4: LTV/CAC */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="text-[11px] font-medium text-muted-foreground">LTV/CAC</CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                            <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2 py-1 rounded-lg shadow-xl max-w-[200px]">
                            Relação entre valor vitalício (LTV) e custo de aquisição (CAC). Saudável acima de 3.0x.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HugeiconsIcon icon={ChartUpIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {ltvCacRatio > 0 ? <NumberTicker value={ltvCacRatio} format={(v) => v.toFixed(1)} suffix="x" /> : "—"}
                  </div>
                  <div className="mt-1.5">
                    {ltvCacRatio >= 3.0 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Excelente</Badge>
                    ) : ltvCacRatio > 0 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-amber-500">Atenção</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4">Sem histórico</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* KPI 5: Conversão Global */}
              <Card className="dash-card opacity-0 translate-y-3 col-span-2 md:col-span-3 xl:col-span-1" size="sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="text-[11px] font-medium text-muted-foreground">Conversão Leads</CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                            <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2 py-1 rounded-lg shadow-xl max-w-[200px]">
                            Percentual de leads conquistados em relação ao total no funil comercial.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HugeiconsIcon icon={Target01Icon} strokeWidth={1.5} className="size-3.5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {conversionRate > 0 ? <NumberTicker value={conversionRate} format={(v) => v.toFixed(1)} suffix="%" /> : "—"}
                  </div>
                  <div className="mt-1.5">
                    {conversionRate >= 20 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Alta Eficiência</Badge>
                    ) : conversionRate > 0 ? (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-amber-500">Média</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4">Sem Leads</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Pipeline + Activity */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-5">
              {/* Pipeline */}
              <Card className="dash-card opacity-0 translate-y-3 md:col-span-7" size="sm">
                <CardHeader className="pb-2 border-b border-border/30">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-semibold text-foreground">Pipeline de Clientes</CardTitle>
                    <a href="/pipeline" className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
                      Explorar →
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto no-scrollbar max-h-[280px]">
                    {totalClients === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
                      </div>
                    ) : recentInteractions.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <p className="text-xs text-muted-foreground">Nenhuma interação registrada.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {recentInteractions.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center px-4 py-2.5 hover:bg-muted/30 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                              <div>
                                <div className="text-xs font-medium text-foreground">
                                  {item.type === "delivery" ? "Entrega realizada" :
                                   item.type === "meeting" ? "Reunião realizada" :
                                   item.type === "call" ? "Ligação efetuada" :
                                   item.type === "message" ? "Mensagem enviada" :
                                   item.type === "email" ? "Email enviado" :
                                   "Nota adicionada"}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {item.description || "Sem detalhes"}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="dash-card opacity-0 translate-y-3 md:col-span-5" size="sm">
                <CardHeader className="pb-2 border-b border-border/30">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-semibold text-foreground">Atividade Recente</CardTitle>
                    <span className="size-1.5 rounded-full bg-primary animate-ping" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto no-scrollbar max-h-[280px]">
                    {recentInteractions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-xs text-muted-foreground">Nenhuma atividade registrada.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {recentInteractions.slice(0, 8).map((item) => {
                          return (
                            <div key={item.id} className="flex gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors duration-200">
                              <div className={`mt-1 size-1.5 rounded-full shrink-0 ${
                                item.type === "delivery" ? "bg-green-500" :
                                item.type === "meeting" ? "bg-primary" :
                                "bg-muted-foreground/50"
                              }`} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground leading-snug truncate">
                                  {item.description || item.type}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {timeAgo(item.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Churn Alerts + NPS Chart */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
              {/* Churn Alerts */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className="size-3.5 text-destructive" />
                      <CardTitle className="text-xs font-semibold text-foreground">Retenção & Churn</CardTitle>
                    </div>
                    <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">Ao Vivo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <ChurnAlertCard
                    alerts={churnAlerts}
                    onCall={(clientId) => window.open(`tel:${clientId}`, "_self")}
                    onMessage={(clientId) => (window.location.href = `/inbox?clientId=${clientId}`)}
                  />
                </CardContent>
              </Card>

              {/* NPS per Client Chart */}
              <Card className="dash-card opacity-0 translate-y-3" size="sm">
                <CardHeader className="pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                      <CardTitle className="text-xs font-semibold text-foreground">Satisfação por Cliente</CardTitle>
                    </div>
                    {avgSatisfaction > 0 && (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                        Média {avgSatisfaction.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {satisfactionScores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-muted-foreground">Nenhum dado de satisfação.</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Clientes podem avaliar pelo Portal.</p>
                    </div>
                  ) : (
                    <ChartContainer config={npsChartConfig} className="h-[200px] w-full">
                      <BarChart
                        data={npsChartData}
                        layout="vertical"
                        margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                      >
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          width={90}
                        />
                        <XAxis
                          type="number"
                          domain={[0, 5]}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickCount={6}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => [`${value}/5`, "Nota"]}
                              indicator="dot"
                            />
                          }
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                          {npsChartData.map((entry, index) => (
                            <rect key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </section>

          </main>
          )}

          {/* Modal Nova Campanha */}
          {showCampaignModal && (
            <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Criar Nova Campanha</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Adicione uma campanha de anúncios para monitoramento de verba.</p>
                    </div>
                    <button
                      onClick={() => setShowCampaignModal(false)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-200"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCampaign} className="space-y-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-client" className="text-[10px] font-medium text-muted-foreground">Cliente</Label>
                      <select
                        id="c-client"
                        required
                        value={campaignClient}
                        onChange={(e) => setCampaignClient(e.target.value)}
                        className="bg-card border border-border/40 rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 w-full"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients?.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="grid gap-1.5">
                        <Label htmlFor="c-platform" className="text-[10px] font-medium text-muted-foreground">Plataforma</Label>
                        <select
                          id="c-platform"
                          value={campaignPlatform}
                          onChange={(e) => setCampaignPlatform(e.target.value)}
                          className="bg-card border border-border/40 rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
                        >
                          <option value="meta">Meta Ads</option>
                          <option value="google">Google Ads</option>
                          <option value="tiktok">TikTok Ads</option>
                          <option value="other">Outros</option>
                        </select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="c-month" className="text-[10px] font-medium text-muted-foreground">Mês de Vigência</Label>
                        <Input
                          id="c-month"
                          type="text"
                          required
                          value={campaignMonth}
                          onChange={(e) => setCampaignMonth(e.target.value)}
                          placeholder="Ex: Julho/2026"
                          className="bg-muted/10 border-border/40 text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="c-budget" className="text-[10px] font-medium text-muted-foreground">Orçamento Planejado (R$)</Label>
                      <Input
                        id="c-budget"
                        type="number"
                        required
                        value={campaignBudget}
                        onChange={(e) => setCampaignBudget(e.target.value)}
                        placeholder="Ex: 5000"
                        className="bg-muted/10 border-border/40 text-xs h-9"
                      />
                    </div>

                    <div className="pt-1 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCampaignModal(false)}
                        className="text-xs font-medium h-8 px-3 active:scale-[0.98] transition-all duration-200"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={creatingCampaign}
                        className="text-xs font-semibold h-8 px-4 active:scale-[0.98] transition-all duration-200"
                      >
                        {creatingCampaign ? "Criando..." : "Criar Campanha"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="bg-card border border-border/40 rounded-xl p-3 px-4 flex items-center gap-2.5 shadow-xl max-w-sm">
                <div className={`size-1.5 rounded-full shrink-0 ${
                  toast.type === "success" ? "bg-primary" : "bg-destructive"
                }`} />
                <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
              </div>
            </div>
          )}
        </>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  )
}

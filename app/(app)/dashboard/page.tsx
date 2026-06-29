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
  Note01Icon,
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChurnAlertCard } from "@/components/churn-alert-card"
import { FocusCenter } from "@/components/focus-center"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Badge } from "@/components/ui/badge"
import { SettingsSection } from "@/components/settings"
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
    gsap.to(".dash-item", {
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.04,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      delay: 0.1,
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
    <div ref={containerRef} className="flex flex-col w-full h-[calc(100vh-3rem)] overflow-hidden bg-background select-none">
      {loading || !dashboardData ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-muted-foreground animate-pulse">Carregando dashboard...</span>
        </div>
      ) : (
        <>
          {/* View Tabs */}
          <div className="flex items-center gap-1 px-4 md:px-5 lg:px-6 pt-3 pb-px border-b border-border/30">
            <button
              onClick={() => setView("focus")}
              className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-t-xl transition-all duration-300 cursor-pointer ${
                view === "focus"
                  ? "bg-background text-foreground shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              Foco do Dia
            </button>
            <button
              onClick={() => setView("overview")}
              className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-t-xl transition-all duration-300 cursor-pointer ${
                view === "overview"
                  ? "bg-background text-foreground shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
              <div className="mb-6">
                <h1 className="text-xl font-heading font-semibold">
                  Dashboard
                </h1>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Visao geral do seu negocio
                </p>
              </div>

              {/* Quick Stats - Revenue */}
              <SettingsSection title="Receita" description="Indicadores financeiros do mes">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="dash-item opacity-0 translate-y-3 group card-modern hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          MRR
                        </p>
                        <p className="text-lg font-heading font-bold">
                          R$ <NumberTicker value={mrr} />
                        </p>
                        <p className="text-[9px] text-muted-foreground">Receita mensal recorrente</p>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-2 group-hover:bg-primary/15 transition-colors">
                        <HugeiconsIcon icon={ChartUpIcon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="dash-item opacity-0 translate-y-3 group card-modern hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Total de Clientes
                        </p>
                        <p className="text-lg font-heading font-bold">
                          <NumberTicker value={totalClients} />
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                            <NumberTicker value={activeClients} /> Ativos
                          </Badge>
                          {atRiskClients > 0 && (
                            <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                              <NumberTicker value={atRiskClients} /> Risco
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-2 group-hover:bg-primary/15 transition-colors">
                        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="dash-item opacity-0 translate-y-3 group card-modern hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Exposicao a Churn
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-lg font-heading font-bold">
                            <NumberTicker value={churnAlerts.length} />
                          </p>
                          <span className="text-[9px] text-muted-foreground">contas</span>
                        </div>
                        <div>
                          {churnAlerts.length > 0 ? (
                            <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">Acao Requerida</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Saudavel</Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl bg-destructive/10 p-2 group-hover:bg-destructive/15 transition-colors">
                        <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="h-4 w-4 text-destructive" />
                      </div>
                    </div>
                  </div>

                  <div className="dash-item opacity-0 translate-y-3 group card-modern hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Satisfacao (NPS)
                        </p>
                        <p className="text-lg font-heading font-bold">
                          {avgSatisfaction > 0 ? <NumberTicker value={avgSatisfaction} format={(v) => v.toFixed(1)} /> : "\u2014"}
                          {avgSatisfaction > 0 && <span className="text-xs text-muted-foreground/40">/5</span>}
                        </p>
                        <div>
                          {avgSatisfaction >= 4 ? (
                            <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-green-600 dark:text-green-400">Excelente</Badge>
                          ) : avgSatisfaction >= 3 ? (
                            <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4 text-amber-500">Neutro</Badge>
                          ) : avgSatisfaction > 0 ? (
                            <Badge variant="destructive" className="text-[9px] font-semibold px-1.5 py-0 h-4">Critico</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4">Sem dados</Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-2 group-hover:bg-primary/15 transition-colors">
                        <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsSection>

              {/* Two Column: Activity + Actions */}
              <div className="grid gap-4 lg:grid-cols-2 mt-6">
                {/* Recent Activity */}
                <div className="dash-item opacity-0 translate-y-3 card-modern space-y-3">
                  <div>
                    <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center">
                        <HugeiconsIcon icon={Note01Icon} strokeWidth={1.5} className="size-3.5 text-primary" />
                      </div>
                      Atividade Recente
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-9">Ultimas interacoes com clientes</p>
                  </div>

                  <div className="space-y-3">
                    {recentInteractions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
                    ) : (
                      recentInteractions.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className={`size-2 rounded-full ${
                              item.type === "delivery" ? "bg-green-500" :
                              item.type === "meeting" ? "bg-primary" :
                              "bg-muted-foreground/50"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground leading-snug truncate">
                              {item.type === "delivery" ? "Entrega realizada" :
                               item.type === "meeting" ? "Reuniao realizada" :
                               item.type === "call" ? "Ligacao efetuada" :
                               item.type === "message" ? "Mensagem enviada" :
                               item.type === "email" ? "Email enviado" :
                               "Nota adicionada"}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {item.description || "Sem detalhes"} \u2022 {timeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {recentInteractions.length > 0 && (
                    <div className="pt-3 border-t border-border/30">
                      <Button variant="ghost" size="sm" className="w-full text-[9px] h-7 rounded-xl">
                        <a href="/pipeline" className="flex items-center gap-1">
                          Ver pipeline completo
                          <span className="text-[10px]">\u2192</span>
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="dash-item opacity-0 translate-y-3 card-modern space-y-3">
                  <div>
                    <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center">
                        <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                      </div>
                      Acoes Rapidas
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-9">Gerencie seus clientes e campanhas</p>
                  </div>

                  <div className="space-y-2.5">
                    <a href="/clients" className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-primary/20 transition-all group">
                      <div className="rounded-xl bg-blue-500/10 p-2 group-hover:scale-105 transition-transform">
                        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-heading font-semibold">Ver Clientes</p>
                        <p className="text-[9px] text-muted-foreground">Gerencie seu CRM</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">\u2192</span>
                    </a>

                    <a href="/inbox" className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-primary/20 transition-all group">
                      <div className="rounded-xl bg-green-500/10 p-2 group-hover:scale-105 transition-transform">
                        <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-heading font-semibold">Inbox Chat</p>
                        <p className="text-[9px] text-muted-foreground">Mensagens omnichannel</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">\u2192</span>
                    </a>

                    <button
                      onClick={() => setShowCampaignModal(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-primary/20 transition-all group cursor-pointer"
                    >
                      <div className="rounded-xl bg-purple-500/10 p-2 group-hover:scale-105 transition-transform">
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-heading font-semibold">Nova Campanha</p>
                        <p className="text-[9px] text-muted-foreground">Criar campanha de anuncios</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">\u2192</span>
                    </button>

                    <a href="/settings/integrations" className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-primary/20 transition-all group">
                      <div className="rounded-xl bg-amber-500/10 p-2 group-hover:scale-105 transition-transform">
                        <HugeiconsIcon icon={Download01Icon} strokeWidth={1.5} className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-heading font-semibold">Integracoes</p>
                        <p className="text-[9px] text-muted-foreground">Conecte ferramentas externas</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">\u2192</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Two Column: Churn + NPS */}
              <div className="grid gap-4 lg:grid-cols-2 mt-6">
                {/* Churn Alerts */}
                <div className="dash-item opacity-0 translate-y-3 card-modern space-y-3">
                  <div>
                    <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className="size-3.5 text-destructive" />
                      </div>
                      Retencao & Churn
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-9">Clientes em risco de cancelamento</p>
                  </div>
                  <ChurnAlertCard
                    alerts={churnAlerts}
                    onCall={(clientId) => window.open(`tel:${clientId}`, "_self")}
                    onMessage={(clientId) => (window.location.href = `/inbox?clientId=${clientId}`)}
                  />
                </div>

                {/* NPS Chart */}
                <div className="dash-item opacity-0 translate-y-3 card-modern space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
                        <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center">
                          <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
                        </div>
                        Satisfacao por Cliente
                      </h2>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-9">Notas de satisfacao do NPS</p>
                    </div>
                    {avgSatisfaction > 0 && (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                        Media {avgSatisfaction.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  {satisfactionScores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-muted-foreground">Nenhum dado de satisfacao.</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">Clientes podem avaliar pelo Portal.</p>
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
                </div>
              </div>

            </main>
          )}

          {/* Modal Nova Campanha */}
          {showCampaignModal && (
            <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md card-modern shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-heading font-semibold">Criar Nova Campanha</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Adicione uma campanha de anuncios para monitoramento de verba.</p>
                  </div>
                  <button
                    onClick={() => setShowCampaignModal(false)}
                    className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl hover:bg-muted active:scale-[0.98] transition-all duration-200"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  </button>
                </div>
                <form onSubmit={handleCreateCampaign} className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-client" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Cliente</Label>
                    <select
                      id="c-client"
                      required
                      value={campaignClient}
                      onChange={(e) => setCampaignClient(e.target.value)}
                      className="bg-card border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 w-full"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-platform" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Plataforma</Label>
                      <select
                        id="c-platform"
                        value={campaignPlatform}
                        onChange={(e) => setCampaignPlatform(e.target.value)}
                        className="bg-card border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
                      >
                        <option value="meta">Meta Ads</option>
                        <option value="google">Google Ads</option>
                        <option value="tiktok">TikTok Ads</option>
                        <option value="other">Outros</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-month" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Mes de Vigencia</Label>
                      <Input
                        id="c-month"
                        type="text"
                        required
                        value={campaignMonth}
                        onChange={(e) => setCampaignMonth(e.target.value)}
                        placeholder="Ex: Julho/2026"
                        className="bg-muted/10 border-border/40 text-xs h-9 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-budget" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Orcamento Planejado (R$)</Label>
                    <Input
                      id="c-budget"
                      type="number"
                      required
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      placeholder="Ex: 5000"
                      className="bg-muted/10 border-border/40 text-xs h-9 rounded-xl"
                    />
                  </div>

                  <div className="pt-1 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCampaignModal(false)}
                      className="text-[10px] font-bold uppercase tracking-wider h-8 px-3 active:scale-[0.98] transition-all duration-200 rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingCampaign}
                      className="text-[10px] font-bold uppercase tracking-wider h-8 px-4 active:scale-[0.98] transition-all duration-200 rounded-xl"
                    >
                      {creatingCampaign ? "Criando..." : "Criar Campanha"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="bg-card border border-border/40 rounded-2xl p-3 px-4 flex items-center gap-2.5 shadow-xl max-w-sm">
                <div className={`size-2 rounded-full shrink-0 ${
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

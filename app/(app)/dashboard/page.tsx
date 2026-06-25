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
  ContactBookIcon,
  TimeQuarterPassIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  Download01Icon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ChurnAlertCard } from "@/components/churn-alert-card"
import { authClient } from "@/lib/auth-client"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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

const interactionIcons: Record<string, typeof Alert01Icon> = {
  message: ContactBookIcon,
  call: ContactBookIcon,
  meeting: ContactBookIcon,
  delivery: CheckmarkCircle02Icon,
  note: ContactBookIcon,
  email: ContactBookIcon,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Agora"
  if (mins < 60) return `Há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Há ${hours}h`
  const days = Math.floor(hours / 24)
  return `Há ${days}d`
}

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: session } = authClient.useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [churnAlerts, setChurnAlerts] = useState<
    { clientId: string; clientName: string; daysSinceContact: number; severity: "warning" | "critical" }[]
  >([])

  // Modal Campaign states
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignClient, setCampaignClient] = useState("")
  const [campaignPlatform, setCampaignPlatform] = useState("meta")
  const [campaignMonth, setCampaignMonth] = useState("")
  const [campaignBudget, setCampaignBudget] = useState("")
  const [creatingCampaign, setCreatingCampaign] = useState(false)
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
    gsap.from(".hero-text", {
      opacity: 0,
      y: -12,
      duration: 1.0,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      stagger: 0.08,
    })
    gsap.from(".double-bezel-card", {
      y: 20,
      scale: 0.98,
      opacity: 0,
      duration: 1.1,
      stagger: 0.06,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all",
    })
  }, { scope: containerRef })

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

  if (loading || !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-[calc(100vh-3.5rem)]">
        <span className="text-xs text-muted-foreground animate-pulse">Carregando dashboard...</span>
      </div>
    )
  }

  const { mrr, totalClients, activeClients, atRiskClients, onboardingClients, recentInteractions, satisfactionScores, avgSatisfaction, ltvCacRatio, conversionRate, clients } = dashboardData

  return (
    <div ref={containerRef} className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background select-none">
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/40">
          <div>
            <div className="hero-text flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                Control Center · Receita Recorrente
              </p>
            </div>
            <h1 className="hero-text text-3xl md:text-4xl font-display font-medium leading-none tracking-tight text-foreground">
              R$ {mrr.toLocaleString("pt-BR")}
              <span className="text-muted-foreground/40 text-lg md:text-xl font-normal tracking-normal ml-1.5">
                /mês
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateReport}
              variant="outline"
              className="text-xs h-9 gap-1.5 border-border/40 hover:bg-muted font-medium active:scale-[0.98] transition-all duration-300"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" />
              Gerar Relatório
            </Button>
            <Button
              onClick={() => setShowCampaignModal(true)}
              className="text-xs h-9 gap-1.5 active:scale-[0.98] transition-all duration-300 font-semibold"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Nova Campanha
            </Button>
          </div>
        </section>

        {/* KPI Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 grid-flow-dense gap-4 pb-8">
          {/* KPI 1: Total de Clientes */}
          <div className="double-bezel-card group col-span-1 md:col-span-4 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-border">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] h-full flex flex-col p-5 hover:bg-muted/5 transition-colors duration-500">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                  Total de Clientes
                </span>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-4 text-primary" />
                </div>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-display font-medium tracking-tight text-foreground">
                  {totalClients}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                  <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                    {activeClients} Ativos
                  </span>
                  {atRiskClients > 0 && (
                    <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-2 py-0.5 uppercase">
                      {atRiskClients} Em Risco
                    </span>
                  )}
                  {onboardingClients > 0 && (
                    <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5 uppercase">
                      {onboardingClients} Onboarding
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KPI 2: Churn Risk */}
          <div className="double-bezel-card group col-span-1 md:col-span-4 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-border">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] h-full flex flex-col p-5 hover:bg-muted/5 transition-colors duration-500">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                  Exposição a Churn
                </span>
                <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-4 text-destructive" />
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-display font-medium tracking-tight text-foreground">
                    {churnAlerts.length}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Contas</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                  {churnAlerts.length > 0 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-2 py-0.5 uppercase">
                      Ação Requerida
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-2 py-0.5 uppercase">
                      Saudável
                    </span>
                  )}
                  monitoramento de retenção
                </div>
              </div>
            </div>
          </div>

          {/* KPI 3: NPS Médio */}
          <div className="double-bezel-card group col-span-1 md:col-span-4 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-border">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] h-full flex flex-col p-5 hover:bg-muted/5 transition-colors duration-500">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                  Satisfação Média (NPS)
                </span>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-4 text-primary" />
                </div>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-display font-medium tracking-tight text-foreground">
                  {avgSatisfaction > 0 ? `${avgSatisfaction.toFixed(1)}` : "—"}
                  {avgSatisfaction > 0 && <span className="text-lg text-muted-foreground/40">/5</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                  {avgSatisfaction >= 4 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-2 py-0.5 uppercase">
                      Excelente
                    </span>
                  ) : avgSatisfaction >= 3 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5 uppercase">
                      Neutro
                    </span>
                  ) : avgSatisfaction > 0 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-2 py-0.5 uppercase">
                      Crítico
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground ring-1 ring-border/30 rounded-full px-2 py-0.5 uppercase">
                      Sem dados
                    </span>
                  )}
                  {satisfactionScores.length} avaliações
                </div>
              </div>
            </div>
          </div>
          {/* KPI 4: LTV/CAC Ratio */}
          <div className="double-bezel-card group col-span-1 md:col-span-6 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-border">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] h-full flex flex-col p-5 hover:bg-muted/5 transition-colors duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                    Proporção LTV/CAC
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs animate-in fade-in duration-300">
                        Relação entre o valor vitalício gerado pelo cliente (LTV) e o custo de aquisição (CAC). Saudável acima de 3.0x.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <HugeiconsIcon icon={ChartUpIcon} strokeWidth={1.5} className="size-4 text-primary" />
                </div>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-display font-medium tracking-tight text-foreground">
                  {ltvCacRatio > 0 ? `${ltvCacRatio.toFixed(1)}x` : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                  {ltvCacRatio >= 3.0 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-2 py-0.5 uppercase">
                      Excelente
                    </span>
                  ) : ltvCacRatio > 0 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5 uppercase">
                      Atenção
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground ring-1 ring-border/30 rounded-full px-2 py-0.5 uppercase">
                      Sem Histórico
                    </span>
                  )}
                  baseado em faturamento/investimento
                </div>
              </div>
            </div>
          </div>

          {/* KPI 5: Conversão Global */}
          <div className="double-bezel-card group col-span-1 md:col-span-6 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-border">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] h-full flex flex-col p-5 hover:bg-muted/5 transition-colors duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                    Conversão Global de Leads
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs animate-in fade-in duration-300">
                        Percentual de leads conquistados (won) em relação ao total de leads no funil comercial.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <HugeiconsIcon icon={Target01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                </div>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-display font-medium tracking-tight text-foreground">
                  {conversionRate > 0 ? `${conversionRate.toFixed(1)}%` : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                  {conversionRate >= 20 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-2 py-0.5 uppercase">
                      Alta Eficiência
                    </span>
                  ) : conversionRate > 0 ? (
                    <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5 uppercase">
                      Média
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground ring-1 ring-border/30 rounded-full px-2 py-0.5 uppercase">
                      Sem Leads
                    </span>
                  )}
                  conversões comerciais concluídas
                </div>
              </div>
            </div>
          </div>
          {/* Pipeline de Clientes */}
          <div className="double-bezel-card col-span-1 md:col-span-8 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] flex flex-col min-h-[340px]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] flex-1 flex flex-col overflow-hidden">
              <div className="p-4 px-6 border-b border-border/40 flex justify-between items-center bg-muted/5">
                <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Pipeline de Clientes
                </h2>
                <a href="/pipeline" className="text-[10px] font-bold tracking-widest uppercase text-primary hover:text-primary/80 transition-colors duration-300">
                  Explorar Pipeline →
                </a>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col divide-y divide-border/40">
                {totalClients === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
                  </div>
                ) : (
                  recentInteractions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                      <p className="text-xs text-muted-foreground">Nenhuma interação registrada.</p>
                    </div>
                  ) : (
                    recentInteractions.map((item) => (
                      <div
                        key={item.id}
                        className="group/row flex justify-between items-center p-4 px-6 hover:bg-muted/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-2 rounded-full bg-border group-hover/row:bg-primary group-hover/row:scale-125 transition-all duration-300" />
                          <div>
                            <div className="text-sm font-semibold text-foreground tracking-tight">
                              {item.type === "delivery" ? "Entrega realizada" :
                               item.type === "meeting" ? "Reunião realizada" :
                               item.type === "call" ? "Ligação efetuada" :
                               item.type === "message" ? "Mensagem enviada" :
                               item.type === "email" ? "Email enviado" :
                               "Nota adicionada"}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wider font-medium">
                              {item.description || "Sem detalhes"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="double-bezel-card col-span-1 md:col-span-4 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] flex flex-col min-h-[340px]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] flex-1 flex flex-col overflow-hidden">
              <div className="p-4 px-6 border-b border-border/40 flex justify-between items-center bg-muted/5">
                <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Atividade Recente
                </h2>
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
                {recentInteractions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-muted-foreground">Nenhuma atividade registrada.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">As interações com clientes aparecerão aqui.</p>
                  </div>
                ) : (
                  recentInteractions.slice(0, 6).map((item, i) => {
                    const Icon = interactionIcons[item.type] || ContactBookIcon
                    return (
                      <div key={item.id}>
                        <div className="flex gap-3.5 group/item hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                          <div className={`mt-1.5 size-1.5 rounded-full shrink-0 ${
                            item.type === "delivery" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" :
                            item.type === "meeting" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" :
                            "bg-muted-foreground/60"
                          }`} />
                          <div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {item.description || `${item.type}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        {i < Math.min(recentInteractions.length, 6) - 1 && (
                          <div className="my-4 h-px bg-border/40" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Churn Alerts */}
          <div className="double-bezel-card col-span-1 md:col-span-6 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className="size-4 text-destructive" />
                    <h3 className="font-semibold text-xs text-foreground font-display tracking-wider uppercase">
                      Monitoramento de Retenção & Churn
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-2 py-0.5 uppercase">
                    Ao Vivo
                  </span>
                </div>
                <ChurnAlertCard
                  alerts={churnAlerts}
                  onCall={(clientId) => window.open(`tel:${clientId}`, "_self")}
                  onMessage={(clientId) => (window.location.href = `/inbox?clientId=${clientId}`)}
                />
              </div>
            </div>
          </div>

          {/* NPS per Client */}
          <div className="double-bezel-card col-span-1 md:col-span-6 bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-4 text-primary" />
                  <h3 className="font-semibold text-xs text-foreground font-display tracking-wider uppercase">
                    Índice de Satisfação por Cliente
                  </h3>
                </div>
                {avgSatisfaction > 0 && (
                  <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                    Média {avgSatisfaction.toFixed(1)}
                  </span>
                )}
              </div>

              {satisfactionScores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-xs text-muted-foreground">Nenhum dado de satisfação computado.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Os clientes podem avaliar pelo Portal do Cliente.</p>
                </div>
              ) : (
                <div className="space-y-4 my-auto">
                  {satisfactionScores.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 group/nps">
                      <span className="text-xs font-semibold text-foreground w-36 truncate tracking-tight group-hover/nps:text-primary transition-colors">
                        {c.name}
                      </span>
                      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden p-0.5 ring-1 ring-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            c.score >= 4 ? "bg-green-500" : c.score >= 3 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${(c.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-display font-bold text-foreground w-8 text-right">
                        {c.score}.0<span className="text-muted-foreground/50 text-[9px]">/5</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal Nova Campanha */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowCampaignModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Criar Nova Campanha</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Adicione uma campanha de anúncios para monitoramento de verba.</p>
              
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="c-client" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Cliente</Label>
                  <select
                    id="c-client"
                    required
                    value={campaignClient}
                    onChange={(e) => setCampaignClient(e.target.value)}
                    className="bg-card border border-border/40 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10 w-full"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-platform" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Plataforma</Label>
                    <select
                      id="c-platform"
                      value={campaignPlatform}
                      onChange={(e) => setCampaignPlatform(e.target.value)}
                      className="bg-card border border-border/40 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                    >
                      <option value="meta">Meta Ads</option>
                      <option value="google">Google Ads</option>
                      <option value="tiktok">TikTok Ads</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-month" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Mês de Vigência</Label>
                    <Input
                      id="c-month"
                      type="text"
                      required
                      value={campaignMonth}
                      onChange={(e) => setCampaignMonth(e.target.value)}
                      placeholder="Ex: Julho/2026"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="c-budget" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Orçamento Planejado (R$)</Label>
                  <Input
                    id="c-budget"
                    type="number"
                    required
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(e.target.value)}
                    placeholder="Ex: 5000"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCampaignModal(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingCampaign}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingCampaign ? "Criando..." : "Criar Campanha"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast notification (Double-Bezel style) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-2xl shadow-2xl">
            <div className="bg-card rounded-[calc(1rem-0.25rem)] p-3 px-4 flex items-center gap-3 max-w-sm">
              <div className={`size-2 rounded-full shrink-0 ${
                toast.type === "success" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]"
              }`} />
              <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
            </div>
          </div>
        </div>
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

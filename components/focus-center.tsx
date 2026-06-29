"use client"

import React, { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Calendar03Icon,
  Message01Icon,
  FileAttachmentIcon,
  Shield01Icon,
  ArrowRight01Icon,
  Rocket01Icon,
  Settings01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import Link from "next/link"
import { SettingsSection } from "@/components/settings"

interface PriorityItem {
  id: string
  type: string
  priority: "critical" | "high" | "medium" | "low"
  clientId: string
  clientName: string
  label: string
  action: string
  meetingDate?: string
}

interface FocusData {
  priorityItems: PriorityItem[]
  pendingTasksCount: number
  pendingApprovalsCount: number
  upcomingMeetingsCount: number
  churnRiskCount: number
  onboardingCount: number
}

const PRIORITY_CONFIG = {
  critical: {
    dot: "bg-destructive",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    label: "Urgente",
    labelBg: "bg-destructive/10",
    labelText: "text-destructive",
    borderColor: "border-destructive/20",
  },
  high: {
    dot: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    label: "Alta",
    labelBg: "bg-amber-500/10",
    labelText: "text-amber-500",
    borderColor: "border-amber-500/20",
  },
  medium: {
    dot: "bg-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    label: "Media",
    labelBg: "bg-primary/10",
    labelText: "text-primary",
    borderColor: "border-border/40",
  },
  low: {
    dot: "bg-muted-foreground/40",
    iconBg: "bg-muted/50",
    iconColor: "text-muted-foreground",
    label: "Baixa",
    labelBg: "bg-muted/50",
    labelText: "text-muted-foreground",
    borderColor: "border-border/40",
  },
}

const TYPE_EXPLANATIONS: Record<string, string> = {
  churn_risk: "Cliente sem contato — envie uma mensagem ou agende uma call",
  pending_approval: "Material aguardando aprovacao do cliente",
  unsigned_contract: "Contrato pronto, precisa de assinatura",
  scope_alert: "Escopo quase no limite — considere renovar ou expandir",
  upcoming_meeting: "Reuniao marcada nos proximos 7 dias",
  onboarding_incomplete: "Onboarding pendente — complete as tarefas restantes",
}

const ACTION_ICONS: Record<string, React.ComponentProps<typeof HugeiconsIcon>["icon"]> = {
  inbox: Message01Icon,
  approval: FileAttachmentIcon,
  contract: Shield01Icon,
  scope: Settings01Icon,
  meeting: Calendar03Icon,
  onboarding: Rocket01Icon,
  task: CheckmarkCircle02Icon,
}

const ACTION_URLS: Record<string, (clientId: string) => string> = {
  inbox: (id) => `/inbox?clientId=${id}`,
  approval: (id) => `/clients/${id}`,
  contract: (id) => `/clients/${id}`,
  scope: (id) => `/clients/${id}`,
  meeting: (id) => `/clients/${id}`,
  onboarding: (id) => `/clients/${id}`,
  task: (id) => `/clients/${id}`,
}

function PriorityCard({ item }: { item: PriorityItem }) {
  const config = PRIORITY_CONFIG[item.priority]
  const icon = ACTION_ICONS[item.action] || ArrowRight01Icon
  const url = ACTION_URLS[item.action]?.(item.clientId) || `/clients/${item.clientId}`
  const explanation = TYPE_EXPLANATIONS[item.type]

  return (
    <Link href={url}>
      <div
        className={`focus-card group flex items-start gap-3 p-3 rounded-xl border ${config.borderColor} bg-background hover:border-primary/20 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] cursor-pointer`}
      >
        <div className={`rounded-xl ${config.iconBg} p-2 shrink-0 group-hover:scale-105 transition-transform`}>
          <HugeiconsIcon icon={icon} strokeWidth={1.5} className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-heading font-semibold text-foreground truncate">
              {item.clientName}
            </span>
            <span
              className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${config.labelBg} ${config.labelText}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {item.label}
          </p>
          {explanation && (
            <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">
              {explanation}
            </p>
          )}
          {item.meetingDate && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3 text-primary" />
              <p className="text-[9px] text-primary font-medium">
                {new Date(item.meetingDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function FocusSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-5 lg:p-6 max-w-[1200px] w-full mx-auto space-y-6">
      <div className="space-y-1">
        <div className="h-5 w-32 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-3 w-48 bg-muted/20 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-modern h-24 bg-muted/10 animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/10 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export function FocusCenter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<FocusData | null>(null)
  const [loading, setLoading] = useState(true)

  useGSAP(() => {
    if (loading || !data) return

    gsap.fromTo(
      ".focus-header",
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "cubic-bezier(0.32,0.72,0,1)",
      }
    )
    gsap.fromTo(
      ".focus-stat",
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        delay: 0.1,
      }
    )
    gsap.fromTo(
      ".focus-section",
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        delay: 0.25,
      }
    )
  }, { scope: containerRef, dependencies: [loading, data] })

  useEffect(() => {
    fetch("/api/dashboard/focus")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <FocusSkeleton />
  }

  const criticalItems = data.priorityItems.filter((i) => i.priority === "critical")
  const highItems = data.priorityItems.filter((i) => i.priority === "high")
  const mediumItems = data.priorityItems.filter((i) => i.priority === "medium")
  const lowItems = data.priorityItems.filter((i) => i.priority === "low")

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col p-4 md:p-5 lg:p-6 max-w-[1200px] w-full mx-auto overflow-y-auto overflow-x-hidden no-scrollbar"
    >
      {/* Header */}
      <div className="focus-header mb-6">
        <h1 className="text-lg font-heading font-semibold">
          {greeting()}
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1">
          {data.priorityItems.length === 0
            ? "Nenhuma acao pendente no momento. Tudo em dia!"
            : `${data.priorityItems.length} ${data.priorityItems.length > 1 ? "ações" : "ação"} prioritária${data.priorityItems.length > 1 ? "s" : ""} identificada${data.priorityItems.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Quick Stats */}
      <SettingsSection title="Resumo do Dia" description="Indicadores rapidos do que precisa da sua atencao">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/clients" className="focus-stat">
            <div className="card-modern hover-lift group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Tarefas</p>
                  <p className="text-lg font-heading font-bold">{data.pendingTasksCount}</p>
                  <p className="text-[9px] text-muted-foreground">Pendentes</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2 group-hover:bg-primary/15 transition-colors">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/clients" className="focus-stat">
            <div className="card-modern hover-lift group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Aprovacoes</p>
                  <p className="text-lg font-heading font-bold">{data.pendingApprovalsCount}</p>
                  <p className="text-[9px] text-muted-foreground">Ag. aprovacao</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2 group-hover:bg-amber-500/15 transition-colors">
                  <HugeiconsIcon icon={FileAttachmentIcon} strokeWidth={1.5} className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/clients" className="focus-stat">
            <div className="card-modern hover-lift group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Reunioes</p>
                  <p className="text-lg font-heading font-bold">{data.upcomingMeetingsCount}</p>
                  <p className="text-[9px] text-muted-foreground">Prox. 7 dias</p>
                </div>
                <div className="rounded-xl bg-green-500/10 p-2 group-hover:bg-green-500/15 transition-colors">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/clients" className="focus-stat">
            <div className="card-modern hover-lift group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risco</p>
                  <p className="text-lg font-heading font-bold">{data.churnRiskCount}</p>
                  <p className="text-[9px] text-muted-foreground">Sem contato</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-2 group-hover:bg-destructive/15 transition-colors">
                  <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className="h-4 w-4 text-destructive" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </SettingsSection>

      {/* Priority Items */}
      {data.priorityItems.length === 0 ? (
        <div className="focus-section mt-6">
          <div className="card-modern flex flex-col items-center justify-center py-12 text-center">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-7 text-primary" />
            </div>
            <p className="text-sm font-heading font-semibold text-foreground">Tudo em dia!</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 max-w-[280px]">
              Nenhuma acao urgente pendente. Aproveite para:
            </p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              <Link
                href="/clients"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[9px] font-bold text-muted-foreground hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-2.5" />
                Ver tarefas
              </Link>
              <Link
                href="/inbox"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[9px] font-bold text-muted-foreground hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all"
              >
                <HugeiconsIcon icon={Message01Icon} className="size-2.5" />
                Contatar cliente
              </Link>
              <Link
                href="/clients"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[9px] font-bold text-muted-foreground hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all"
              >
                <HugeiconsIcon icon={Calendar03Icon} className="size-2.5" />
                Agendar reuniao
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Critical */}
          {criticalItems.length > 0 && (
            <SettingsSection
              title="Acao Imediata"
              description={`${criticalItems.length} item${criticalItems.length > 1 ? "s" : ""} requer${criticalItems.length === 1 ? "" : "em"} atencao agora`}
            >
              <div className="space-y-2.5 gap-0.5 grid">
                {criticalItems.map((item) => (
                  <PriorityCard key={item.id} item={item} />
                ))}
              </div>
            </SettingsSection>
          )}

          {/* High */}
          {highItems.length > 0 && (
            <SettingsSection
              title="Alta Prioridade"
              description={`${highItems.length} item${highItems.length > 1 ? "s" : ""} para hoje`}
            >
              <div className="space-y-2.5 gap-0.5 grid">
                {highItems.map((item) => (
                  <PriorityCard key={item.id} item={item} />
                ))}
              </div>
            </SettingsSection>
          )}

          {/* Medium */}
          {mediumItems.length > 0 && (
            <SettingsSection
              title="Proximos Passos"
              description={`${mediumItems.length} item${mediumItems.length > 1 ? "s" : ""} no fluxo`}
            >
              <div className="space-y-2.5 gap-0.5 grid">
                {mediumItems.map((item) => (
                  <PriorityCard key={item.id} item={item} />
                ))}
              </div>
            </SettingsSection>
          )}

          {/* Low */}
          {lowItems.length > 0 && (
            <SettingsSection
              title="Quando Puder"
              description={`${lowItems.length} item${lowItems.length > 1 ? "s" : ""} opcional${lowItems.length > 1 ? "is" : ""}`}
            >
              <div className="space-y-2.5 gap-0.5 grid">
                {lowItems.map((item) => (
                  <PriorityCard key={item.id} item={item} />
                ))}
              </div>
            </SettingsSection>
          )}
        </div>
      )}
    </div>
  )
}

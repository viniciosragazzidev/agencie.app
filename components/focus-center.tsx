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
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import Link from "next/link"

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
    bg: "bg-destructive/[0.06]",
    ring: "ring-destructive/20",
    dot: "bg-destructive",
    label: "Urgente",
    labelBg: "bg-destructive/10",
    labelText: "text-destructive",
    description: "Requer acao imediata — risco de perda do cliente",
  },
  high: {
    bg: "bg-amber-500/[0.04]",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
    label: "Alta",
    labelBg: "bg-amber-500/10",
    labelText: "text-amber-500",
    description: "Acao necessaria hoje para evitar atrasos",
  },
  medium: {
    bg: "bg-primary/[0.03]",
    ring: "ring-primary/15",
    dot: "bg-primary",
    label: "Media",
    labelBg: "bg-primary/10",
    labelText: "text-primary",
    description: "Proximo passo no fluxo do cliente",
  },
  low: {
    bg: "bg-muted/20",
    ring: "ring-border/40",
    dot: "bg-muted-foreground/40",
    label: "Baixa",
    labelBg: "bg-muted/50",
    labelText: "text-muted-foreground",
    description: "Pode agendar para quando tiver tempo",
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
        className={`focus-card group flex items-start gap-3 p-3.5 rounded-2xl ring-1 ${config.ring} ${config.bg} transition-all duration-300 hover:scale-[0.98] cursor-pointer active:scale-[0.96]`}
      >
        <div className={`mt-0.5 size-2 rounded-full ${config.dot} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-foreground truncate">
              {item.clientName}
            </span>
            <span
              className={`text-[7px] font-bold tracking-widest uppercase px-1.5 py-px rounded-full ${config.labelBg} ${config.labelText}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            {item.label}
          </p>
          {explanation && (
            <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">
              {explanation}
            </p>
          )}
          {item.meetingDate && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <HugeiconsIcon icon={Calendar03Icon} className="size-2.5 text-primary" />
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
        <HugeiconsIcon
          icon={icon}
          className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors duration-300 shrink-0 mt-0.5"
        />
      </div>
    </Link>
  )
}

function StatPill({
  icon,
  label,
  value,
  href,
  description,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  label: string
  value: number
  href: string
  description?: string
}) {
  return (
    <Link
      href={href}
      className="focus-stat flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 ring-1 ring-border/30 hover:bg-muted/30 transition-all duration-300 active:scale-[0.98]"
      title={description}
    >
      <HugeiconsIcon
        icon={icon}
        className="size-3.5 text-muted-foreground/60"
      />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-muted-foreground font-medium">
          {label}
        </span>
        {description && (
          <p className="text-[8px] text-muted-foreground/50 truncate">{description}</p>
        )}
      </div>
      <span className="text-[11px] font-bold text-foreground">
        {value}
      </span>
    </Link>
  )
}

function FocusSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-5 lg:p-6 max-w-[1200px] w-full mx-auto space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-48 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-3 w-64 bg-muted/20 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-muted/20 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-muted/15 rounded-2xl animate-pulse"
          />
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
      ".focus-greeting",
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
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
        stagger: 0.06,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        delay: 0.15,
      }
    )
    gsap.fromTo(
      ".focus-card",
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        delay: 0.3,
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

  const criticalItems = data.priorityItems.filter(
    (i) => i.priority === "critical"
  )
  const highItems = data.priorityItems.filter((i) => i.priority === "high")
  const mediumItems = data.priorityItems.filter(
    (i) => i.priority === "medium"
  )
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
      <div className="focus-greeting mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Central de Foco
          </p>
        </div>
        <h1 className="text-base md:text-lg font-display font-semibold text-foreground">
          {greeting()}, aqui esta o que precisa da sua atencao
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1">
          {data.priorityItems.length === 0
            ? "Nenhuma acao pendente no momento. Tudo em dia!"
            : `${data.priorityItems.length} acao${data.priorityItems.length > 1 ? "oes" : ""} prioritaria${data.priorityItems.length > 1 ? "s" : ""} identificada${data.priorityItems.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 md:mb-6">
        <StatPill
          icon={CheckmarkCircle02Icon}
          label="Tarefas"
          value={data.pendingTasksCount}
          href="/clients"
          description="Tarefas de projetos pendentes"
        />
        <StatPill
          icon={FileAttachmentIcon}
          label="Aprovacoes"
          value={data.pendingApprovalsCount}
          href="/clients"
          description="Materiais aguardando aprovacao"
        />
        <StatPill
          icon={Calendar03Icon}
          label="Reunioes"
          value={data.upcomingMeetingsCount}
          href="/clients"
          description="Reunioes nos proximos 7 dias"
        />
        <StatPill
          icon={Alert01Icon}
          label="Risco"
          value={data.churnRiskCount}
          href="/clients"
          description="Clientes sem contato recente"
        />
      </div>

      {data.priorityItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="size-6 text-primary"
            />
          </div>
          <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px]">
            Nenhuma acao urgente pendente. Aproveite para:
          </p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Link
              href="/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 text-[9px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-2.5" />
              Ver tarefas
            </Link>
            <Link
              href="/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 text-[9px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <HugeiconsIcon icon={Message01Icon} className="size-2.5" />
              Contatar cliente
            </Link>
            <Link
              href="/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 text-[9px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <HugeiconsIcon icon={Calendar03Icon} className="size-2.5" />
              Agendar reuniao
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {criticalItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-destructive/80">
                  Acao Imediata
                </h3>
                <span className="text-[8px] text-muted-foreground/50">
                  — {criticalItems.length} item{criticalItems.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {criticalItems.map((item) => (
                  <PriorityCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}

          {highItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80">
                  Alta Prioridade
                </h3>
                <span className="text-[8px] text-muted-foreground/50">
                  — {highItems.length} item{highItems.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {highItems.map((item) => (
                  <PriorityCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}

          {mediumItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="size-1.5 rounded-full bg-primary" />
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                  Proximos Passos
                </h3>
                <span className="text-[8px] text-muted-foreground/50">
                  — {mediumItems.length} item{mediumItems.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {mediumItems.map((item) => (
                  <PriorityCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}

          {lowItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Quando Puder
                </h3>
                <span className="text-[8px] text-muted-foreground/50">
                  — {lowItems.length} item{lowItems.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {lowItems.map((item) => (
                  <PriorityCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

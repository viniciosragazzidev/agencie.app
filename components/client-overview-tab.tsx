"use client"

import React, { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Rocket01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Message01Icon,
  Calendar03Icon,
  FolderOpenIcon,
  Settings01Icon,
  Link01Icon,
  Coins01Icon,
  Shield01Icon,
  ArrowRight01Icon,
  RefreshIcon,
  Chart01Icon,
  Briefcase01Icon,
  NoteIcon,
  Alert01Icon,
  TelephoneIcon,
  FileAttachmentIcon,
} from "@hugeicons/core-free-icons"

// ── Types ──────────────────────────────────────────────────────
interface Client {
  id: string
  name: string
  industry?: string | null
  status: "Ativo" | "Em Risco" | "Onboarding"
  projects: string
  mrr: string
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  portalEnabled: boolean
  createdAt: string
}

interface KpiData {
  label: string
  value: string | number
  subtitle?: string
  iconName: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  color: string
}

interface ActionData {
  id: string
  label: string
  description: string
  iconName: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  onClick: () => void
  priority: "high" | "medium" | "low"
}

interface Interaction {
  id: string
  type: string
  description?: string | null
  createdAt: string
}

type Stage = "onboarding" | "active" | "at_risk"

interface ClientOverviewTabProps {
  client: Client
  tasks: Array<{ id: string; status: string }>
  approvals: Array<{ id: string; status: string }>
  onboardingTasks: Array<{ id: string; isCompleted: boolean }>
  interactions: Interaction[]
  scopes: Array<{ id: string; label?: string; totalQuota: number; usedQuota: number }>
  satisfaction: Array<{ id: string; score: number }>
  contracts: Array<{ id: string; status: string }>
  meetings: Array<{ id: string; status: string }>
  stage: Stage
  onNavigate: (path: string) => void
  onModalAction: (action: string) => void
}

// ── Helpers ────────────────────────────────────────────────────
function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86400000)
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const days = daysBetween(date, now)
  if (days === 0) return "Hoje"
  if (days === 1) return "Ontem"
  if (days < 7) return `${days} dias atrás`
  if (days < 30) return `${Math.floor(days / 7)} sem atrás`
  return `${Math.floor(days / 30)} mês atrás`
}

// ── Sub-components ─────────────────────────────────────────────

function KpiCard({ label, value, subtitle, iconName, color }: KpiData) {
  return (
    <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-4 rounded-[1.25rem] transition-all duration-300 hover:bg-muted/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <p className={`text-xl font-display font-bold mt-1 leading-none ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{subtitle}</p>
          )}
        </div>
        <span className={`${color} opacity-50 shrink-0 mt-0.5`}>
          <HugeiconsIcon icon={iconName} className="w-4 h-4" />
        </span>
      </div>
    </div>
  )
}

function ActionCard({ label, description, iconName, priority, onClick }: ActionData) {
  const priorityStyles = {
    high: "ring-amber-500/20 hover:ring-amber-500/40 bg-amber-500/[0.03]",
    medium: "ring-border/40 hover:ring-primary/30 bg-card",
    low: "ring-border/40 hover:ring-border/60 bg-card",
  }

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-[1.25rem] ring-1 ${priorityStyles[priority]}
        transition-all duration-300 active:scale-[0.98] group cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
          <HugeiconsIcon icon={iconName} className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 mt-1 shrink-0"
        />
      </div>
    </button>
  )
}

function InteractionRow({ interaction }: { interaction: Interaction }) {
  const typeConfig: Record<string, string> = {
    message: "💬",
    call: "📞",
    meeting: "📅",
    delivery: "📦",
    note: "📝",
    email: "✉️",
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/15 last:border-0 group">
      <span className="text-sm shrink-0">{typeConfig[interaction.type] || "📝"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground/80 truncate leading-relaxed">
          {interaction.description || "Interação registrada"}
        </p>
      </div>
      <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
        {formatRelativeTime(interaction.createdAt)}
      </span>
    </div>
  )
}

// ── Stage Config ───────────────────────────────────────────────

const STAGE_CONFIG = {
  onboarding: {
    label: "Primeiros Passos",
    subtitle: "Complete os passos abaixo para começar a trabalhar com este cliente",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.04]",
    ring: "ring-amber-500/20",
    dotColor: "bg-amber-500",
    iconEmoji: "🚀",
  },
  active: {
    label: "Próximos Passos",
    subtitle: "Mantenha o momentum e continue entregando valor",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.04]",
    ring: "ring-emerald-500/20",
    dotColor: "bg-emerald-500",
    iconEmoji: "📈",
  },
  at_risk: {
    label: "Ações de Recuperação",
    subtitle: "Este cliente precisa de atenção. Aja agora para evitar churn",
    color: "text-red-500",
    bg: "bg-red-500/[0.04]",
    ring: "ring-red-500/20",
    dotColor: "bg-red-500",
    iconEmoji: "⚠️",
  },
}

// ── Main Component ─────────────────────────────────────────────

export function ClientOverviewTab({
  client,
  tasks,
  approvals,
  onboardingTasks,
  interactions,
  scopes,
  satisfaction,
  contracts,
  meetings,
  stage,
  onNavigate,
  onModalAction,
}: ClientOverviewTabProps) {
  const config = STAGE_CONFIG[stage]

  // ── KPIs ───────────────────────────────────────────────────
  const kpis = useMemo<KpiData[]>(() => {
    const doneTasks = tasks.filter((t) => t.status === "done").length
    const totalTasks = tasks.length
    const pendingApprovals = approvals.filter((a) => a.status === "pending").length
    const lastInteraction = interactions[0]
    const daysSinceContact = lastInteraction
      ? daysBetween(new Date(lastInteraction.createdAt), new Date())
      : null

    return [
      {
        label: "Tarefas",
        value: totalTasks === 0 ? "0" : `${doneTasks}/${totalTasks}`,
        subtitle:
          totalTasks === 0
            ? "Nenhuma tarefa criada"
            : `${Math.round((doneTasks / totalTasks) * 100)}% concluído`,
        iconName: CheckmarkCircle02Icon,
        color:
          doneTasks === totalTasks && totalTasks > 0
            ? "text-emerald-500"
            : "text-blue-500",
      },
      {
        label: "Aprovações",
        value: pendingApprovals,
        subtitle:
          pendingApprovals === 0 ? "Tudo aprovado" : "Aguardando cliente",
        iconName: FileAttachmentIcon,
        color: pendingApprovals > 0 ? "text-amber-500" : "text-emerald-500",
      },
      {
        label: "MRR",
        value: `R$ ${parseFloat(client.mrr || "0").toLocaleString("pt-BR")}`,
        subtitle: client.status,
        iconName: Coins01Icon,
        color: "text-emerald-500",
      },
      {
        label: "Último Contato",
        value: daysSinceContact !== null ? `${daysSinceContact}d` : "N/A",
        subtitle:
          daysSinceContact !== null
            ? daysSinceContact < 7
              ? "Recente"
              : daysSinceContact < 14
                ? "Atenção"
                : "Crítico"
            : "Sem interações",
        iconName: Clock01Icon,
        color:
          daysSinceContact !== null
            ? daysSinceContact < 7
              ? "text-emerald-500"
              : daysSinceContact < 14
                ? "text-amber-500"
                : "text-red-500"
            : "text-muted-foreground",
      },
    ]
  }, [client, tasks, approvals, interactions, satisfaction])

  // ── Onboarding Progress ─────────────────────────────────────
  const onboardingProgress = useMemo(() => {
    if (!Array.isArray(onboardingTasks) || onboardingTasks.length === 0) return null
    const done = onboardingTasks.filter((t) => t.isCompleted).length
    return {
      done,
      total: onboardingTasks.length,
      percent: Math.round((done / onboardingTasks.length) * 100),
    }
  }, [onboardingTasks])

  // ── Actions ────────────────────────────────────────────────
  const actions = useMemo<ActionData[]>(() => {
    const list: ActionData[] = []

    if (stage === "onboarding") {
      list.push({
        id: "briefing",
        label: "Preencher Briefing",
        description: "Coletar informações do projeto e objetivos do cliente",
        iconName: NoteIcon,
        onClick: () => onModalAction("briefing"),
        priority: "high",
      })
      list.push({
        id: "contract",
        label: "Enviar Contrato",
        description:
          contracts.length === 0
            ? "Gerar e enviar contrato para assinatura"
            : contracts.some((c) => c.status === "signed")
              ? "Contrato já assinado"
              : "Contrato pendente de assinatura",
        iconName: Shield01Icon,
        onClick: () => onModalAction("contract"),
        priority: contracts.length === 0 || !contracts.some((c) => c.status === "signed") ? "high" : "low",
      })
      list.push({
        id: "portal",
        label: "Ativar Portal do Cliente",
        description: client.portalEnabled
          ? "Portal já está ativo"
          : "Liberar acesso ao portal de acompanhamento",
        iconName: Link01Icon,
        onClick: () => onModalAction("portal"),
        priority: client.portalEnabled ? "low" : "high",
      })
      list.push({
        id: "scope",
        label: "Definir Escopo",
        description:
          scopes.length === 0
            ? "Definir quotas e serviços contratados"
            : `${scopes.length} itens de escopo definidos`,
        iconName: Settings01Icon,
        onClick: () => onModalAction("scope"),
        priority: scopes.length === 0 ? "medium" : "low",
      })
      list.push({
        id: "kickoff",
        label: "Agendar Kickoff",
        description:
          meetings.length === 0
            ? "Agendar reunião inicial com o cliente"
            : `${meetings.length} reuniões agendadas`,
        iconName: Calendar03Icon,
        onClick: () => onModalAction("meeting"),
        priority: meetings.length === 0 ? "medium" : "low",
      })
      list.push({
        id: "first-task",
        label: "Criar Primeira Tarefa",
        description:
          tasks.length === 0
            ? "Começar a organizar o trabalho"
            : `${tasks.length} tarefas no quadro`,
        iconName: CheckmarkCircle02Icon,
        onClick: () => onModalAction("task"),
        priority: tasks.length === 0 ? "medium" : "low",
      })
    }

    if (stage === "active") {
      const pendingApprovals = approvals.filter(a => a.status === "pending").length
      const pendingTasks = tasks.filter(t => t.status !== "done").length
      const doneTasks = tasks.filter(t => t.status === "done").length
      const hasHighScope = scopes.some(s => s.totalQuota > 0 && s.usedQuota / s.totalQuota > 0.8)
      const noInteractions = interactions.length === 0
      const oldInteraction = interactions.length > 0 && daysBetween(new Date(interactions[0].createdAt), new Date()) > 14

      if (tasks.length === 0) {
        list.push({
          id: "first-task",
          label: "Criar Primeira Tarefa",
          description: "Comece organizando o trabalho deste cliente",
          iconName: CheckmarkCircle02Icon,
          onClick: () => onModalAction("task"),
          priority: "high",
        })
      } else if (pendingTasks > 0) {
        list.push({
          id: "pending-tasks",
          label: "Concluir Tarefas Pendentes",
          description: `${pendingTasks} tarefa${pendingTasks > 1 ? "s" : ""} pendente${pendingTasks > 1 ? "s" : ""} — ${doneTasks} concluída${doneTasks !== 1 ? "s" : ""}`,
          iconName: CheckmarkCircle02Icon,
          onClick: () => onModalAction("task"),
          priority: "high",
        })
      }

      if (pendingApprovals > 0) {
        list.push({
          id: "pending-approvals",
          label: "Revisar Aprovações",
          description: `${pendingApprovals} aprovação${pendingApprovals > 1 ? "s pendentes" : " pendente"} — aguardando revisão do cliente`,
          iconName: FileAttachmentIcon,
          onClick: () => onModalAction("approval"),
          priority: "high",
        })
      }

      if (hasHighScope) {
        const alertScope = scopes.find(s => s.totalQuota > 0 && s.usedQuota / s.totalQuota > 0.8)
        const pct = alertScope ? Math.round((alertScope.usedQuota / alertScope.totalQuota) * 100) : 0
        list.push({
          id: "scope-alert",
          label: "Escopo Próximo do Limite",
          description: `${alertScope?.label || "Item"} em ${pct}% — considere expandir ou revisar`,
          iconName: Alert01Icon,
          onClick: () => onModalAction("scope"),
          priority: "high",
        })
      } else if (scopes.length === 0) {
        list.push({
          id: "define-scope",
          label: "Definir Escopo do Cliente",
          description: "Defina quotas e serviços contratados",
          iconName: Settings01Icon,
          onClick: () => onModalAction("scope"),
          priority: "medium",
        })
      }

      if (meetings.length === 0) {
        list.push({
          id: "schedule-checkin",
          label: "Agendar Check-in",
          description: "Agende um retorno regular com o cliente",
          iconName: Calendar03Icon,
          onClick: () => onModalAction("meeting"),
          priority: "medium",
        })
      }

      if (noInteractions || oldInteraction) {
        const timeHint = noInteractions
          ? "Nenhuma interação registrada"
          : `Última interação: ${formatRelativeTime(interactions[0].createdAt)}`
        list.push({
          id: "send-message",
          label: "Enviar Mensagem",
          description: `${timeHint} — retome o contato`,
          iconName: Message01Icon,
          onClick: () => onNavigate(`/inbox?clientId=${client.id}`),
          priority: noInteractions ? "medium" : "low",
        })
      }

      if (tasks.length > 0 && pendingTasks === 0 && pendingApprovals === 0 && !hasHighScope) {
        list.push({
          id: "expansion",
          label: "Gerar Proposta de Expansão",
          description: "Tudo em dia — proponha novos serviços ou escopo",
          iconName: Briefcase01Icon,
          onClick: () => onModalAction("proposal"),
          priority: "low",
        })
      }
    }

    if (stage === "at_risk") {
      list.push({
        id: "urgent-checkin",
        label: "Enviar Check-in Urgente",
        description: "Fazer contato imediato com o cliente",
        iconName: TelephoneIcon,
        onClick: () => onNavigate(`/inbox?clientId=${client.id}`),
        priority: "high",
      })
      list.push({
        id: "retention-call",
        label: "Agendar Call de Retenção",
        description: "Conversa dedicada para entender necessidades",
        iconName: Calendar03Icon,
        onClick: () => onModalAction("meeting"),
        priority: "high",
      })
      list.push({
        id: "last-contact",
        label: "Verificar Último Contato",
        description:
          interactions.length > 0
            ? `Última interação: ${formatRelativeTime(interactions[0].createdAt)}`
            : "Nenhuma interação registrada",
        iconName: Clock01Icon,
        onClick: () => onModalAction("interactions"),
        priority: "medium",
      })
      list.push({
        id: "satisfaction",
        label: "Revisar Satisfação",
        description:
          satisfaction.length > 0
            ? `NPS médio: ${Math.round(satisfaction.reduce((s, v) => s + v.score, 0) / satisfaction.length)}/10`
            : "Nenhum score registrado",
        iconName: RefreshIcon,
        onClick: () => onModalAction("satisfaction"),
        priority: satisfaction.length > 0 ? "medium" : "low",
      })
      list.push({
        id: "report",
        label: "Gerar Relatório",
        description: "Exportar dados completos deste cliente",
        iconName: Chart01Icon,
        onClick: () => onNavigate(`/reports?clientId=${client.id}`),
        priority: "low",
      })
    }

    return list.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })
  }, [stage, client, tasks, approvals, onboardingTasks, interactions, scopes, satisfaction, contracts, meetings, onNavigate, onModalAction])

  return (
    <div className="space-y-6 tab-content-item">
      {/* ── KPIs Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Onboarding Progress ── */}
      {stage === "onboarding" && onboardingProgress && (
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-4 rounded-[1.25rem]">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Progresso do Onboarding
            </p>
            <span className="text-[10px] font-bold text-amber-500">
              {onboardingProgress.percent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${onboardingProgress.percent}%` }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-2">
            {onboardingProgress.done} de {onboardingProgress.total} tarefas concluídas
          </p>
        </div>
      )}

      {/* ── Stage Header ───────────────────────────────────── */}
      <div
        className={`double-bezel-card ${config.bg} ring-1 ${config.ring} p-5 rounded-[1.5rem]`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${config.bg} ring-1 ${config.ring} flex items-center justify-center`}>
            <span className="text-base">{config.iconEmoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
              <h3 className={`font-display font-bold text-sm ${config.color}`}>
                {config.label}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <ActionCard key={action.id} {...action} />
        ))}
      </div>

      {/* ── Recent Activity ────────────────────────────────── */}
      {interactions.length > 0 && (
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-5 rounded-[1.5rem]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-xs text-foreground">
              Atividade Recente
            </h3>
            <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
              {interactions.length} registros
            </span>
          </div>
          <div className="space-y-0">
            {interactions.slice(0, 5).map((interaction) => (
              <InteractionRow key={interaction.id} interaction={interaction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

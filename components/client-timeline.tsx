"use client"

import React, { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Message01Icon,
  Calendar03Icon,
  FileAttachmentIcon,
  NoteIcon,
  CheckmarkCircle02Icon,
  FolderOpenIcon,
  Rocket01Icon,
  Shield01Icon,
  FavouriteIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"

interface TimelineItem {
  id: string
  type: string
  subtype: string
  description: string | null
  date: string
  userId: string | null
}

interface ClientTimelineProps {
  clientId: string
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
    color: string
    bg: string
    filterIcon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  }
> = {
  interaction: { icon: Message01Icon, color: "text-blue-500", bg: "bg-blue-500/10", filterIcon: Message01Icon },
  note: { icon: NoteIcon, color: "text-purple-500", bg: "bg-purple-500/10", filterIcon: NoteIcon },
  approval: {
    icon: FileAttachmentIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    filterIcon: FileAttachmentIcon,
  },
  task: {
    icon: CheckmarkCircle02Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    filterIcon: CheckmarkCircle02Icon,
  },
  meeting: { icon: Calendar03Icon, color: "text-primary", bg: "bg-primary/10", filterIcon: Calendar03Icon },
  contract: { icon: Shield01Icon, color: "text-red-500", bg: "bg-red-500/10", filterIcon: Shield01Icon },
  briefing: {
    icon: NoteIcon,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    filterIcon: NoteIcon,
  },
  asset: { icon: FolderOpenIcon, color: "text-cyan-500", bg: "bg-cyan-500/10", filterIcon: FolderOpenIcon },
  onboarding: {
    icon: Rocket01Icon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    filterIcon: Rocket01Icon,
  },
  satisfaction: {
    icon: FavouriteIcon,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    filterIcon: FavouriteIcon,
  },
  project: {
    icon: Layers01Icon,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    filterIcon: Layers01Icon,
  },
}

const TYPE_LABELS: Record<string, string> = {
  interaction: "Interacao",
  note: "Nota",
  approval: "Aprovacao",
  task: "Tarefa",
  meeting: "Reuniao",
  contract: "Contrato",
  briefing: "Briefing",
  asset: "Asset",
  onboarding: "Onboarding",
  satisfaction: "Satisfacao",
  project: "Projeto",
}

function formatTimelineDate(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function getDateGroup(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays < 1) return "Hoje"
  if (diffDays < 2) return "Ontem"
  if (diffDays < 7) return "Esta semana"
  if (diffDays < 30) return "Este mes"
  return "Anterior"
}

function groupByDate(items: TimelineItem[]): Map<string, TimelineItem[]> {
  const groups = new Map<string, TimelineItem[]>()
  for (const item of items) {
    const group = getDateGroup(item.date)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(item)
  }
  return groups
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 w-16 bg-muted/20 rounded-full animate-pulse"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <div className="size-[22px] rounded-full bg-muted/20 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-20 bg-muted/20 rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/15 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/timeline`)
      .then((r) => r.json())
      .then((data) => setTimeline(data.timeline || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  const filtered = filter
    ? timeline.filter((item) => item.type === filter)
    : timeline

  const types = [...new Set(timeline.map((item) => item.type))]
  const grouped = groupByDate(filtered)

  if (loading) {
    return <TimelineSkeleton />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            filter === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Todos
        </button>
        {types.map((type) => {
          const config = TYPE_CONFIG[type] || TYPE_CONFIG.interaction
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? null : type)}
              className={`flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                filter === type
                  ? `${config.bg} ${config.color}`
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <HugeiconsIcon icon={config.filterIcon} className="size-2.5" />
              {TYPE_LABELS[type] || type}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/30" />
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {group}
                </span>
                <span className="text-[8px] text-muted-foreground/40">
                  — {items.length} item{items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.interaction
                  return (
                    <div
                      key={item.id}
                      className="timeline-item flex items-start gap-3 py-2.5 group hover:bg-muted/20 rounded-lg px-2 transition-colors duration-200"
                    >
                      <div
                        className={`relative z-10 size-[22px] rounded-full ${config.bg} flex items-center justify-center shrink-0 ring-2 ring-background`}
                      >
                        <HugeiconsIcon
                          icon={config.icon}
                          className={`size-2.5 ${config.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold tracking-widest uppercase ${config.color}`}
                          >
                            {TYPE_LABELS[item.type] || item.type}
                          </span>
                          <span className="text-[9px] text-muted-foreground/40">
                            {formatTimelineDate(item.date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/80 mt-0.5 leading-relaxed">
                          {item.description || "Atividade registrada"}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <HugeiconsIcon icon={Message01Icon} className="size-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhuma atividade{filter ? ` do tipo "${TYPE_LABELS[filter]}"` : ""} registrada
          </p>
          <p className="text-[9px] text-muted-foreground/50 mt-1">
            As interacoes com o cliente aparecerao aqui
          </p>
        </div>
      )}
    </div>
  )
}

"use client"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ProjectInfoBarProps {
  project: {
    id: string
    name: string
    status: string
    budget?: string
    startDate?: string
    endDate?: string
  }
  taskStats: { total: number; done: number }
  onUpdate: (id: string, data: { name?: string; status?: string; budget?: string }) => void
}

const STATUS_FLOW = ["planning", "in_progress", "review", "done"]

const STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
}

export function ProjectInfoBar({ project, taskStats, onUpdate }: ProjectInfoBarProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project.name)
  const [budget, setBudget] = useState(project.budget || "")

  const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0

  const cycleStatus = () => {
    const idx = STATUS_FLOW.indexOf(project.status)
    const next = STATUS_FLOW[(idx + 1) % STATUS_FLOW.length]
    onUpdate(project.id, { status: next })
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/5 border border-border/20 rounded-xl">
      {editing ? (
        <>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs font-semibold flex-1" />
          <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Orçamento" className="h-8 text-xs w-24" />
          <Button size="sm" variant="outline" onClick={() => { onUpdate(project.id, { name, budget }); setEditing(false) }} className="h-7 text-[9px]">Salvar</Button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold text-foreground truncate">{project.name}</span>
          <button onClick={cycleStatus} className="shrink-0">
            <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary/10 transition-colors">
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </button>
          {project.budget && <span className="text-[10px] text-muted-foreground shrink-0">R$ {parseFloat(project.budget).toLocaleString()}</span>}
          <div className="flex-1" />
          <span className="text-[9px] text-muted-foreground shrink-0">{taskStats.done}/{taskStats.total} tarefas</span>
          <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 text-[9px] px-2">Editar</Button>
        </>
      )}
    </div>
  )
}

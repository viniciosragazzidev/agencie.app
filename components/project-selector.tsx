"use client"
import React, { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface Project {
  id: string
  name: string
  status: string
  budget?: string
}

interface ProjectSelectorProps {
  clientId: string
  selectedProjectId: string | null
  onProjectChange: (projectId: string) => void
  onCreateProject: () => void
  refreshKey?: number
  compact?: boolean
  onProjectsLoaded?: (projects: Project[]) => void
  initialProjects?: Project[]
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  done: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function ProjectSelector({ clientId, selectedProjectId, onProjectChange, onCreateProject, refreshKey, compact, onProjectsLoaded, initialProjects }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || [])
  const [loading, setLoading] = useState(!initialProjects)

  useEffect(() => {
    if (initialProjects) {
      onProjectsLoaded?.(initialProjects)
      return
    }
    setLoading(true)
    fetch(`/api/projects?clientId=${clientId}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setProjects(list)
        onProjectsLoaded?.(list)
      })
      .catch(() => { setProjects([]); onProjectsLoaded?.([]) })
      .finally(() => setLoading(false))
  }, [clientId, refreshKey])

  if (loading) {
    return <div className={`animate-pulse rounded-xl bg-muted/50 ${compact ? "h-8 w-48" : "h-10 w-full"}`} />
  }

  if (projects.length === 0 && !compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border/40 rounded-2xl bg-muted/5">
        <HugeiconsIcon icon={FolderOpenIcon} className="size-10 text-muted-foreground/40 mb-3" />
        <p className="text-xs font-semibold text-muted-foreground mb-1">Nenhum projeto encontrado</p>
        <p className="text-[10px] text-muted-foreground/60 mb-4 text-center">Crie um projeto para começar a gerenciar este cliente.</p>
        <Button onClick={onCreateProject} size="sm" className="gap-1.5 text-[10px] font-bold h-8 px-4 rounded-xl">
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" /> Criar Primeiro Projeto
        </Button>
      </div>
    )
  }

  if (projects.length === 0 && compact) {
    return (
      <Button onClick={onCreateProject} variant="outline" size="sm" className="gap-1.5 text-[10px] font-bold h-8 px-3 rounded-lg border-dashed border-border/40">
        <HugeiconsIcon icon={Add01Icon} className="size-3" /> Novo Projeto
      </Button>
    )
  }

  const selectItems = projects.map(p => ({ label: p.name, value: p.id }))

  return (
    <Select
      value={selectedProjectId || ""}
      onValueChange={(v) => { if (v === "__new__") { onCreateProject() } else if (v) { onProjectChange(v) } }}
      items={selectItems}
    >
      <SelectTrigger className={`text-xs font-semibold rounded-xl border-border/40 bg-muted/10 overflow-hidden ${compact ? "h-8 w-auto min-w-[180px] max-w-[240px]" : "h-10"}`}>
        <SelectValue placeholder="Selecionar projeto..." className="truncate" />
      </SelectTrigger>
      <SelectContent>
        {projects.map(p => (
          <SelectItem key={p.id} value={p.id} className="">
            <div className="flex items-center text-xs gap-2 overflow-hidden">
              <span className="truncate max-w-[110px]  min-w-0">{p.name}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[p.status] || ""}`}>
                {STATUS_LABELS[p.status] || p.status}
              </span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="__new__" className="text-xs text-primary font-semibold">
          + Criar Novo Projeto
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

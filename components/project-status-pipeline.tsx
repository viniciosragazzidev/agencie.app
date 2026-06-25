"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, TimeQuarterPassIcon, Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
}

const columns = [
  { key: "todo" as const, label: "A Fazer", icon: Cancel01Icon, color: "muted" },
  { key: "in_progress" as const, label: "Em Execução", icon: TimeQuarterPassIcon, color: "primary" },
  { key: "done" as const, label: "Concluído", icon: CheckmarkCircle02Icon, color: "green-500" },
]

export function ProjectStatusPipeline({ tasks, onMove, onDelete }: {
  tasks: Task[]
  onMove: (id: string, status: Task["status"]) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] flex flex-col h-[400px]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={col.icon} strokeWidth={1.5} className={`size-4 text-${col.color}`} />
                  <h3 className="font-semibold text-xs text-foreground font-display">{col.label}</h3>
                </div>
                <span className={`text-[9px] font-bold bg-${col.color}/10 text-${col.color} rounded px-1.5 py-0.5`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                {colTasks.map(task => (
                  <div key={task.id} className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-2 group">
                    <p className="text-xs text-foreground font-semibold">{task.title}</p>
                    <div className="flex justify-end gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.key !== "done" && (
                        <Button variant="outline" size="sm" onClick={() => onMove(task.id, col.key === "todo" ? "in_progress" : "done")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider">
                          Avançar
                        </Button>
                      )}
                      {col.key !== "todo" && (
                        <Button variant="outline" size="sm" onClick={() => onMove(task.id, col.key === "done" ? "in_progress" : "todo")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider">
                          Reverter
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10">
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

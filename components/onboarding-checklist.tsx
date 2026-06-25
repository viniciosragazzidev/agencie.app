"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

interface OnboardingTask {
  id: string
  title: string
  description?: string
  isRequired: boolean
  isCompleted: boolean
}

export function OnboardingChecklist({ tasks, onToggle }: {
  tasks: OnboardingTask[]
  onToggle: (id: string, completed: boolean) => void
}) {
  const completed = tasks.filter(t => t.isCompleted).length
  const total = tasks.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Progresso do Onboarding
        </p>
        <p className="text-xs font-semibold text-foreground">{completed}/{total}</p>
      </div>
      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => onToggle(task.id, !task.isCompleted)}
            className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              task.isCompleted
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/10 border-border/30 hover:border-border/50"
            }`}
          >
            <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
              task.isCompleted ? "bg-primary/20" : "bg-muted/20"
            }`}>
              <HugeiconsIcon
                icon={task.isCompleted ? CheckmarkCircle02Icon : Cancel01Icon}
                strokeWidth={1.5}
                className={`size-4 ${task.isCompleted ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${task.isCompleted ? "text-primary line-through" : "text-foreground"}`}>
                {task.title}
              </p>
              {task.description && <p className="text-[10px] text-muted-foreground">{task.description}</p>}
            </div>
            {task.isRequired && (
              <span className="text-[8px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-1.5 py-0.5 uppercase shrink-0">
                Obrigatório
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

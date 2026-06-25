"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ApprovalItem {
  id: string
  title: string
  description?: string
  fileUrl?: string
  fileType: string
  status: "pending" | "approved" | "revision"
  clientComment?: string
}

const statusClasses = {
  pending: "bg-muted text-muted-foreground ring-border/30",
  approved: "bg-primary/10 text-primary ring-primary/20",
  revision: "bg-destructive/10 text-destructive ring-destructive/20",
}

const statusLabels = {
  pending: "Aguardando",
  approved: "Aprovado",
  revision: "Revisão",
}

export function ApprovalPanel({ items, onApprove, onRevision }: {
  items: ApprovalItem[]
  onApprove: (id: string) => void
  onRevision: (id: string, comment: string) => void
}) {
  return (
    <div className="space-y-3">
      {items.map(item => {
        const cls = statusClasses[item.status] || statusClasses.pending
        const label = statusLabels[item.status] || statusLabels.pending
        return (
          <div key={item.id} className="p-4 bg-muted/5 border border-border/30 rounded-2xl space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.fileType.toUpperCase()}</p>
              </div>
              <span className={`text-[9px] font-bold tracking-widest ${cls} ring-1 rounded-full px-2 py-0.5 uppercase`}>
                {label}
              </span>
            </div>
            {item.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</p>}
            {item.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button 
                  size="sm" 
                  onClick={() => onApprove(item.id)} 
                  className="text-[9px] h-7 px-3 font-bold uppercase tracking-wider gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-3" /> Aprovar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onRevision(item.id, "")} 
                  className="text-[9px] h-7 px-3 font-bold uppercase tracking-wider gap-1 border-destructive/20 text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3" /> Solicitar Ajuste
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

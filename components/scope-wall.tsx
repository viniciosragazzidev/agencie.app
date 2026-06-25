"use client"

import React from "react"

interface ScopeItem {
  id: string
  label: string
  totalQuota: number
  usedQuota: number
  period: string
}

export function ScopeWall({ scopes }: { scopes: ScopeItem[] }) {
  if (scopes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-xs text-muted-foreground">Nenhum escopo configurado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {scopes.map(scope => {
        const remaining = scope.totalQuota - scope.usedQuota
        const percentage = (scope.usedQuota / scope.totalQuota) * 100
        const isOver = remaining <= 0

        return (
          <div key={scope.id} className="p-3.5 bg-muted/10 border border-border/30 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">{scope.label}</p>
              <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ring-1 ${
                isOver
                  ? "bg-destructive/10 text-destructive ring-destructive/20"
                  : percentage > 80
                  ? "bg-secondary text-secondary-foreground ring-border/50"
                  : "bg-primary/10 text-primary ring-primary/20"
              }`}>
                {remaining} restante{remaining !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isOver ? "bg-destructive" : percentage > 80 ? "bg-muted-foreground" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{scope.usedQuota} / {scope.totalQuota} consumidos</span>
              <span className="capitalize">{scope.period === "monthly" ? "Mensal" : scope.period === "quarterly" ? "Trimestral" : "Único"}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

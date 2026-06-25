"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface AdSpend {
  id: string
  month: string
  plannedBudget: string
  spentAmount: string
  platform: string
}

export function AdSpendMeter({ trackers, onDelete, onEdit }: {
  trackers: AdSpend[]
  onDelete: (id: string) => void
  onEdit: (item: AdSpend) => void
}) {
  if (trackers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-xs text-muted-foreground">Nenhum rastreamento de verba configurado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {trackers.map((t) => {
        const planned = parseFloat(t.plannedBudget)
        const spent = parseFloat(t.spentAmount)
        const percentage = planned > 0 ? (spent / planned) * 100 : 0
        const barColor = percentage > 100 ? "hsl(var(--destructive))" : percentage > 80 ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"

        return (
          <div key={t.id} className="p-3.5 bg-muted/5 border border-border/30 rounded-2xl space-y-2 group">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{t.platform}</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(t)}
                    className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(t.id)}
                    className="size-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3" />
                  </Button>
                </div>
                <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ring-1 ${
                  percentage > 100 ? "bg-destructive/10 text-destructive ring-destructive/20" :
                  percentage > 80 ? "bg-secondary text-secondary-foreground ring-border/50" :
                  "bg-primary/10 text-primary ring-primary/20"
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Planejado", value: planned }, { name: "Gasto", value: spent }]} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={12}>
                    <Cell fill="hsl(var(--muted))" />
                    <Cell fill={barColor} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Gasto: R$ {spent.toLocaleString()}</span>
              <span>Planejado: R$ {planned.toLocaleString()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

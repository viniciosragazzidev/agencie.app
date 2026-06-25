"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

interface AdSpend {
  id: string
  month: string
  plannedBudget: string
  spentAmount: string
  platform: string
}

export function AdSpendMeter({ trackers }: { trackers: AdSpend[] }) {
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
          <div key={t.id} className="p-3.5 bg-muted/5 border border-border/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{t.platform}</p>
              <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ring-1 ${
                percentage > 100 ? "bg-destructive/10 text-destructive ring-destructive/20" :
                percentage > 80 ? "bg-secondary text-secondary-foreground ring-border/50" :
                "bg-primary/10 text-primary ring-primary/20"
              }`}>
                {percentage.toFixed(0)}%
              </span>
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

"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, TelephoneIcon, Message01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ChurnAlert {
  clientId: string
  clientName: string
  daysSinceContact: number
  severity: "warning" | "critical"
}

export function ChurnAlertCard({ alerts, onCall, onMessage }: {
  alerts: ChurnAlert[]
  onCall: (clientId: string) => void
  onMessage: (clientId: string) => void
}) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-8 text-green-500 mb-2" />
        <p className="text-xs text-muted-foreground">Nenhum alerta de churn no momento.</p>
        <p className="text-[10px] text-muted-foreground/60">Todos os clientes estão ativos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.clientId}
          className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
            alert.severity === "critical"
              ? "bg-destructive/5 border-destructive/20"
              : "bg-amber-500/5 border-amber-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              alert.severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
            }`}>
              <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className={`size-5 ${
                alert.severity === "critical" ? "text-destructive" : "text-amber-500"
              }`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{alert.clientName}</p>
              <p className="text-[10px] text-muted-foreground">
                {alert.daysSinceContact} dias sem contato
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onCall(alert.clientId)} className="h-7 text-[9px] font-bold uppercase tracking-wider gap-1">
              <HugeiconsIcon icon={TelephoneIcon} strokeWidth={1.5} className="size-3" /> Ligação
            </Button>
            <Button size="sm" onClick={() => onMessage(alert.clientId)} className="h-7 text-[9px] font-bold uppercase tracking-wider gap-1">
              <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-3" /> Mensagem
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
